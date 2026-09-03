import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Sets up the connection to the Supabase database.
 * All other services reach the database through this one.
 */
@Injectable({ providedIn: 'root' })
export class Supabase {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
  );
}
