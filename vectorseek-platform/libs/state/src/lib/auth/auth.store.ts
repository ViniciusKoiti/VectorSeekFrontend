import { Injectable, computed, signal, effect } from '@angular/core';
import { AuthApiSessionDto, AuthSession, AuthTokens, AuthUserProfile } from '@vectorseek/data-access';

export interface AuthState {
  session: AuthSession | null;
  user: AuthUserProfile | null;
  lastUpdatedAt: number | null;
}

const initialState: AuthState = {
  session: null,
  user: null,
  lastUpdatedAt: null
};

/**
 * Auth Signal Store that keeps the in-memory session shared across the app.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly state = signal<AuthState>(this.loadFromStorage());

  readonly session = computed(() => this.state().session);
  readonly isAuthenticated = computed(() => !!this.state().session?.raw?.access_token);
  readonly user = computed(() => this.state().user);
  readonly tokens = computed<AuthTokens | null>(() => {
    const raw = this.state().session?.raw;
    if (!raw?.access_token || !raw.refresh_token || !raw.expires_in || !raw.token_type) {
      return null;
    }
    return {
      accessToken: raw.access_token,
      refreshToken: raw.refresh_token,
      expiresIn: raw.expires_in,
      tokenType: raw.token_type
    };
  });
  readonly lastUpdatedAt = computed(() => this.state().lastUpdatedAt);

  constructor() {
    // Sync state to localStorage whenever it changes
    effect(() => {
      const state = this.state();
      try {
        if (state.session) {
          localStorage.setItem('auth_session', JSON.stringify(state));
        } else {
          localStorage.removeItem('auth_session');
        }
      } catch (e) {
        console.error('Error saving auth state to localStorage', e);
      }
    });
  }

  private loadFromStorage(): AuthState {
    try {
      const stored = localStorage.getItem('auth_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading auth state from localStorage', e);
    }
    return initialState;
  }

  setUser(user: AuthUserProfile | null): void {
    this.state.update((state) => ({ ...state, user, lastUpdatedAt: Date.now() }));
  }

  setSession(session: AuthSession): void {
    this.state.set({
      session,
      user: null,
      lastUpdatedAt: Date.now()
    });
  }

  updateTokens(tokens: AuthTokens): void {
    this.state.update((state) => {
      if (!state.session) {
        return state;
      }
      const newRaw: AuthApiSessionDto = {
        ...state.session.raw,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: tokens.expiresIn,
        token_type: tokens.tokenType
      };
      return {
        ...state,
        session: { ...state.session, raw: newRaw },
        lastUpdatedAt: Date.now()
      };
    });
  }

  clearSession(): void {
    this.state.set(initialState);
  }
}
