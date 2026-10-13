import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Supabase {
  readonly isConfigured =
    isFilled(environment.supabaseUrl) && isFilled(environment.supabaseAnonKey);

  /** null until environment.ts is filled in. */
  readonly client: SupabaseClient | null = this.isConfigured
    ? createClient(environment.supabaseUrl, environment.supabaseAnonKey)
    : null;

  get required(): SupabaseClient {
    if (!this.client) {
      throw new Error('Aplikacja nie jest jeszcze połączona z Supabase.');
    }
    return this.client;
  }
}

function isFilled(value: string): boolean {
  return !!value && value !== 'TODO';
}

export function toMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    if (/failed to fetch|networkerror/i.test(message)) {
      return 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.';
    }
    return message;
  }
  return 'Coś poszło nie tak. Spróbuj ponownie.';
}
