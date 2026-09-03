import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from './supabase';
import { NewVote, Vote } from './service';

/**
 * Holds the votes cast on a survey and talks to Supabase.
 */
@Injectable({ providedIn: 'root' })
export class Votes {
  private supabase = inject(Supabase);

  /** The votes belonging to the questions loaded last. Starts empty. */
  votelist = signal<Vote[]>([]);

  /** Last error message of the database, otherwise null. */
  errorMessage = signal<string | null>(null);

  /**
   * Loads all votes belonging to the given questions.
   * @param questionIds Ids of the questions whose votes are wanted.
   * @returns Promise that resolves once votelist is in place.
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
   * Saves the ticks of one participant.
   * @param rows One entry per ticked answer.
   * @returns True on success, false when the insert failed.
   */
  async save(rows: NewVote[]): Promise<boolean> {
    const { error } = await this.supabase.client.from('votes').insert(rows);
    if (error) this.errorMessage.set(error.message);
    return !error;
  }
}
