import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from './supabase';
import { NewVote, Vote } from './service';

/**
 * Haelt die abgegebenen Stimmen einer Umfrage und spricht mit Supabase.
 */
@Injectable({ providedIn: 'root' })
export class Votes {
  private supabase = inject(Supabase);

  /** Die Stimmen zu den zuletzt geladenen Fragen. Startet leer. */
  votelist = signal<Vote[]>([]);

  /** Letzte Fehlermeldung der Datenbank, sonst null. */
  errorMessage = signal<string | null>(null);

  /**
   * Laedt alle Stimmen, die zu den uebergebenen Fragen gehoeren.
   * @param questionIds Ids der Fragen, deren Stimmen gesucht sind.
   */
  async load(questionIds: number[]): Promise<void> {
    if (!questionIds.length) {
      this.votelist.set([]);
      return;
    }
    const { data, error } = await this.supabase.client
      .from('votes')
      .select('*')
      .in('question_id', questionIds);
    error ? this.errorMessage.set(error.message) : this.votelist.set(data as Vote[]);
  }

  /**
   * Speichert die Kreuze eines Teilnehmers.
   * @param rows Je ein Eintrag pro angekreuzter Antwort.
   * @returns True bei Erfolg, false wenn das Einfuegen fehlschlug.
   */
  async save(rows: NewVote[]): Promise<boolean> {
    const { error } = await this.supabase.client.from('votes').insert(rows);
    if (error) this.errorMessage.set(error.message);
    return !error;
  }
}
