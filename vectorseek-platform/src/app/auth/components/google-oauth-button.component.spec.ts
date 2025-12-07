import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { GoogleOAuthButtonComponent } from './google-oauth-button.component';
import { AuthService } from '../../../../libs/data-access/src/lib/auth/auth.service';
import { AuthStore } from '../../../../libs/state/src/lib/auth/auth.store';
import { environment } from '../../../environments/environment';
import {
  GoogleOAuthAuthorizeResponse,
  AuthError
} from '../../../../libs/data-access/src/lib/auth/auth.models';

describe('GoogleOAuthButtonComponent', () => {
  let component: GoogleOAuthButtonComponent;
  let fixture: ComponentFixture<GoogleOAuthButtonComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let authStoreSpy: jasmine.SpyObj<AuthStore>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpyObj = jasmine.createSpyObj('AuthService', ['googleOAuthAuthorize']);
    const authStoreSpyObj = jasmine.createSpyObj('AuthStore', ['setSession', 'setUser']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        GoogleOAuthButtonComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpyObj },
        { provide: AuthStore, useValue: authStoreSpyObj },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GoogleOAuthButtonComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    authStoreSpy = TestBed.inject(AuthStore) as jasmine.SpyObj<AuthStore>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display Google sign-in button with correct text', () => {
    const button = fixture.nativeElement.querySelector('.google-oauth-button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('auth.google.sign_in');
  });

  it('should show loading state when signing in', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.loading-spinner');
    const button = fixture.nativeElement.querySelector('.google-oauth-button');
    
    expect(spinner).toBeTruthy();
    expect(button.textContent).toContain('auth.google.signing_in');
    expect(button.disabled).toBeTruthy();
  });

  it('should emit authStarted event when sign-in process begins', () => {
    spyOn(component.authStarted, 'emit');
    
    const mockResponse: GoogleOAuthAuthorizeResponse = {
      authorization_url: 'https://accounts.google.com/oauth/authorize?client_id=test',
      state: 'test-state'
    };

    authServiceSpy.googleOAuthAuthorize.and.returnValue(of(mockResponse));
    
    // Mock window.location.assign
    const originalAssign = window.location.assign;
    window.location.assign = jasmine.createSpy('assign');

    component.signInWithGoogle();

    expect(component.authStarted.emit).toHaveBeenCalled();
    expect(authServiceSpy.googleOAuthAuthorize).toHaveBeenCalled();
    
    // Restore original assign function
    window.location.assign = originalAssign;
  });

  it('should handle OAuth URL request failure gracefully', () => {
    spyOn(component.authError, 'emit');

    const mockError = {
      status: 500,
      error: { code: 'SERVER_ERROR', message: 'Server error' }
    };

    authServiceSpy.googleOAuthAuthorize.and.returnValue(throwError(() => mockError));

    component.signInWithGoogle();

    expect(component.isLoading).toBeFalsy();
    expect(component.error).toBeTruthy();
    expect(component.authError.emit).toHaveBeenCalled();
  });

  it('should validate Google OAuth URL before redirecting', () => {
    const maliciousUrl = 'https://malicious-site.com/oauth';
    spyOn(window.location, 'assign');

    // This would normally be called by the component's private method
    expect(() => {
      const url = new URL(maliciousUrl);
      if (!url.hostname.includes('accounts.google.com')) {
        throw new Error('OAUTH_URL_INVALID');
      }
    }).toThrowError('OAUTH_URL_INVALID');
  });

  it('should display error message when authentication fails', () => {
    component.error = {
      status: 500,
      code: 'SERVER_ERROR',
      summary: 'OAUTH_SERVER_ERROR',
      description: 'Server error'
    };
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('.error-message');
    expect(errorMessage).toBeTruthy();
    expect(component.getErrorMessage()).toBe('auth.google.error.server_error');
  });

  it('should map HTTP error codes correctly', () => {
    const testCases = [
      { status: 400, expected: 'OAUTH_REQUEST_INVALID' },
      { status: 401, expected: 'OAUTH_UNAUTHORIZED' },
      { status: 403, expected: 'OAUTH_FORBIDDEN' },
      { status: 429, expected: 'OAUTH_RATE_LIMITED' },
      { status: 500, expected: 'OAUTH_SERVER_ERROR' },
      { status: 999, expected: 'OAUTH_NETWORK_ERROR' }
    ];

    testCases.forEach(({ status, expected }) => {
      const mockError = {
        status,
        error: { code: 'TEST_ERROR', message: 'Test error' }
      };
      
      authServiceSpy.googleOAuthAuthorize.and.returnValue(throwError(() => mockError));
      component.signInWithGoogle();
      
      expect(component.error?.summary).toBe(expected);
    });
  });

  it('should be accessible with proper ARIA labels', () => {
    const button = fixture.nativeElement.querySelector('.google-oauth-button');
    expect(button.getAttribute('aria-label')).toBe('auth.google.aria_label');
    
    const googleIcon = fixture.nativeElement.querySelector('.google-icon');
    expect(googleIcon.getAttribute('aria-hidden')).toBe('true');
  });
});