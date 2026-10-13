import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Profile } from './models';
import { Supabase } from './supabase';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly supabase = inject(Supabase);
  private readonly router = inject(Router);

  private readonly _profile = signal<Profile | null>(null);
  private readonly email = signal('');
  private ready?: Promise<void>;

  readonly profile = this._profile.asReadonly();
  readonly isManager = computed(() => this._profile()?.role === 'manager');
  readonly displayName = computed(() => this._profile()?.full_name.trim() || this.email());

  /** Restores the saved session; runs once before the first navigation. */
  init(): Promise<void> {
    return (this.ready ??= this.restore());
  }

  homeUrl(): string {
    const profile = this._profile();
    if (!profile) return '/login';
    return profile.role === 'manager' ? '/team' : '/my-tasks';
  }

  async signIn(email: string, password: string): Promise<void> {
    const client = this.supabase.required;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new Error(
        error?.code === 'invalid_credentials' || error?.status === 400
          ? 'Nieprawidłowy e-mail lub hasło.'
          : 'Nie udało się zalogować. Sprawdź połączenie i spróbuj ponownie.',
      );
    }
    try {
      await this.loadProfile(data.user.id, data.user.email ?? email);
    } catch {
      await client.auth.signOut();
      throw new Error('To konto nie ma jeszcze profilu w aplikacji. Skontaktuj się z kierownikiem.');
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.client?.auth.signOut();
    this._profile.set(null);
    await this.router.navigateByUrl('/login');
  }

  private async restore(): Promise<void> {
    const client = this.supabase.client;
    if (!client) return;

    const { data } = await client.auth.getSession();
    const user = data.session?.user;
    if (user) {
      try {
        await this.loadProfile(user.id, user.email ?? '');
      } catch {
        // Profile unavailable (offline or removed): fall back to the login screen.
      }
    }

    client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && this._profile()) {
        this._profile.set(null);
        void this.router.navigateByUrl('/login');
      }
    });
  }

  private async loadProfile(userId: string, email: string): Promise<void> {
    const { data, error } = await this.supabase.required
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .single();
    if (error) throw error;
    this.email.set(email);
    this._profile.set(data as Profile);
  }
}
