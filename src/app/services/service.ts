// src/app/interfaces/survey.ts
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
  ends_at: string;
  category: string;
  questions: Question[];
}

export interface NewSurvey {
  title: string;
  description: string;
  ends_at: string;
  category: string;
  questions_text: string;
  allow_multiple: boolean;
  options: string[];
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
