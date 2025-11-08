import { Injectable, computed, signal } from '@angular/core';
import { AuthSession, AuthTokens, AuthUserProfile } from '@vectorseek/data-access';

export interface AuthState {
  session: AuthSession | null;
  lastUpdatedAt: number | null;
}

const initialState: AuthState = {
  session: null,
  lastUpdatedAt: null
};

/**
 * Auth Signal Store that keeps the in-memory session shared across the app.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly state = signal<AuthState>(initialState);

  readonly session = computed(() => this.state().session);
  readonly isAuthenticated = computed(() => this.state().session !== null);
  readonly user = computed<AuthUserProfile | null>(() => this.state().session?.user ?? null);
  readonly tokens = computed<AuthTokens | null>(() => this.state().session?.tokens ?? null);
  readonly lastUpdatedAt = computed(() => this.state().lastUpdatedAt);

  setSession(session: AuthSession): void {
    this.state.set({
      session,
      lastUpdatedAt: Date.now()
    });
  }

  updateTokens(tokens: AuthTokens): void {
    this.state.update((state) =>
      state.session
        ? {
            session: {
              ...state.session,
              tokens
            },
            lastUpdatedAt: Date.now()
          }
        : state
    );
  }

  clearSession(): void {
    this.state.set(initialState);
  }
}
