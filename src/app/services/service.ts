export interface Question {
  id: number;
  survey_id: number;
  questions_text: string;
  allow_multiple: boolean;
  options: string[];
}

export interface Survey {
  id: number;
  title: string;
  description: string;
  /** End date, or null when the survey runs without one. */
  ends_at: string | null;
  category: string;
  questions: Question[];
}

export interface Vote {
  id: number;
  question_id: number;
  option_index: number;
  created_at: string;
}

export interface NewVote {
  question_id: number;
  option_index: number;
}

export interface NewQuestion {
  questions_text: string;
  allow_multiple: boolean;
  options: string[];
}

export interface NewSurvey {
  title: string;
  description: string;
  /** End date, or null when no date was chosen. */
  ends_at: string | null;
  category: string;
  questions: NewQuestion[];
}

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Supabase {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
  );
}
