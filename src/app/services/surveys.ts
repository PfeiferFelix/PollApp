import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from './supabase';
import { Survey, NewSurvey } from './service';

/**
 * Haelt die Umfragen der App und spricht mit Supabase.
 */
@Injectable({ providedIn: 'root' })
export class Surveys {
  private supabase = inject(Supabase);

  /** Alle geladenen Umfragen samt Fragen. Startet leer. */
  surveylist = signal<Survey[]>([]);

  /** True, solange eine Datenbankanfrage laeuft. */
  isLoading = signal(false);

  /** Letzte Fehlermeldung der Datenbank, sonst null. */
  errorMessage = signal<string | null>(null);

  /**
   * Laedt alle Umfragen mit ihren Fragen aus der Datenbank in surveylist.
   * @returns Promise, das erfuellt ist sobald die Liste steht.
   */
  async load() {
    this.isLoading.set(true);

    const { data, error } = await this.supabase.client
      .from('surveys')
      .select('*, questions(*)')
      .order('ends_at');

    if (error) {
      this.errorMessage.set(error.message);
    } else {
      this.surveylist.set(data as Survey[]);
    }

    this.isLoading.set(false);
  }

  /**
   * Legt eine Umfrage samt ihren Fragen an und laedt die Liste danach neu.
   * @param input Die Daten der neuen Umfrage.
   * @returns True bei Erfolg, false wenn ein Schritt fehlgeschlagen ist.
   */
  async create(input: NewSurvey): Promise<boolean> {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    const surveyId = await this.insertSurvey(input);
    const ok = surveyId === null ? false : await this.insertQuestions(surveyId, input);

    if (surveyId !== null && !ok) await this.deleteSurvey(surveyId);
    this.isLoading.set(false);
    if (ok) await this.load();
    return ok;
  }

  /**
   * Raeumt eine Umfrage weg, deren Frage nicht gespeichert werden konnte.
   * @param id Id der Umfrage, die geloescht wird.
   */
  async deleteSurvey(id: number): Promise<void> {
    await this.supabase.client.from('surveys').delete().eq('id', id);
  }

  /**
   * Legt die Umfrage selbst an und gibt ihre von der Datenbank vergebene Id zurueck.
   * @param input Die Daten der neuen Umfrage.
   * @returns Die neue Id, oder null wenn das Einfuegen fehlschlug.
   */
  async insertSurvey(input: NewSurvey): Promise<number | null> {
    const { data, error } = await this.supabase.client
      .from('surveys')
      .insert(this.surveyRow(input))
      .select('id')
      .single();

    if (error || !data) {
      this.errorMessage.set(error?.message ?? 'Umfrage konnte nicht angelegt werden.');
      return null;
    }
    return data.id;
  }

  /**
   * Schneidet aus den Eingabedaten die Spalten heraus, die in die Tabelle surveys gehoeren.
   * @param input Die Daten der neuen Umfrage.
   * @returns Objekt mit genau den Spalten der Tabelle surveys.
   */
  surveyRow(input: NewSurvey) {
    return {
      title: input.title,
      description: input.description,
      ends_at: input.ends_at,
      category: input.category,
    };
  }

  /**
   * Haengt alle Fragen mit ihren Antworten an eine bereits angelegte Umfrage.
   * @param surveyId Id der Umfrage, zu der die Fragen gehoeren.
   * @param input Die Daten der neuen Umfrage.
   * @returns True bei Erfolg, false wenn das Einfuegen fehlschlug.
   */
  async insertQuestions(surveyId: number, input: NewSurvey): Promise<boolean> {
    const rows = input.questions.map((question) => ({
      survey_id: surveyId,
      ...question,
    }));

    const { error } = await this.supabase.client.from('questions').insert(rows);

    if (error) this.errorMessage.set(error.message);
    return !error;
  }
}
