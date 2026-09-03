import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from './supabase';
import { Survey, NewSurvey } from './service';

/**
 * Holds the surveys of the app and talks to Supabase.
 */
@Injectable({ providedIn: 'root' })
export class Surveys {
  private supabase = inject(Supabase);

  /** All loaded surveys including their questions. Starts empty. */
  surveylist = signal<Survey[]>([]);

  /** True as long as a database request is running. */
  isLoading = signal(false);

  /** Last error message of the database, otherwise null. */
  errorMessage = signal<string | null>(null);

  /**
   * Loads all surveys with their questions from the database into surveylist.
   * @returns Promise that resolves once the list is in place.
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
   * Creates a survey along with its questions and reloads the list afterwards.
   * @param input The data of the new survey.
   * @returns True on success, false when one step failed.
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
   * Clears away a survey whose questions could not be saved.
   * @param id Id of the survey that gets deleted.
   */
  async deleteSurvey(id: number): Promise<void> {
    await this.supabase.client.from('surveys').delete().eq('id', id);
  }

  /**
   * Creates the survey itself and returns the id handed out by the database.
   * @param input The data of the new survey.
   * @returns The new id, or null when the insert failed.
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
   * Cuts the columns belonging to the surveys table out of the input data.
   * @param input The data of the new survey.
   * @returns Object with exactly the columns of the surveys table.
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
   * Appends all questions with their answers to an already created survey.
   * @param surveyId Id of the survey the questions belong to.
   * @param input The data of the new survey.
   * @returns True on success, false when the insert failed.
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
