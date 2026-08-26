import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from './supabase';
import { Survey } from './service';

@Injectable({ providedIn: 'root' })
export class Surveys {
  private supabase = inject(Supabase);

  // Die Box für die Daten. Startet leer.
  surveylist = signal<Survey[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

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
}
