import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    User,
    AuthResponse,
    RefreshResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse
} from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = environment.apiUrl;

    // In-memory access token storage (cleared on page reload)
    private accessToken: string | null = null;

    // Reactive user state
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    // Computed authentication state
    public isAuthenticated$ = computed(() => this.currentUserSubject.value !== null);

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    /**
     * Register a new user
     */
    register(email: string, password: string): Observable<AuthResponse> {
        const request: RegisterRequest = { email, password };

        return this.http.post<AuthResponse>(
            `${this.API_URL}/auth/register`,
            request,
            { withCredentials: true } // Include cookies
        ).pipe(
            tap(response => {
                this.handleAuthSuccess(response);
            }),
            catchError(error => {
                console.error('Registration error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Login user
     */
    login(email: string, password: string): Observable<AuthResponse> {
        const request: LoginRequest = { email, password };

        return this.http.post<AuthResponse>(
            `${this.API_URL}/auth/login`,
            request,
            { withCredentials: true } // Include cookies
        ).pipe(
            tap(response => {
                this.handleAuthSuccess(response);
            }),
            catchError(error => {
                console.error('Login error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Refresh access token using refresh token cookie
     */
    refresh(): Observable<string> {
        return this.http.post<RefreshResponse>(
            `${this.API_URL}/auth/refresh`,
            {},
            { withCredentials: true } // Send refresh token cookie
        ).pipe(
            map(response => {
                this.accessToken = response.accessToken;
                return response.accessToken;
            }),
            catchError(error => {
                console.error('Token refresh failed:', error);
                this.handleAuthFailure();
                return throwError(() => error);
            })
        );
    }

    /**
     * Logout user
     */
    logout(): Observable<any> {
        return this.http.post(
            `${this.API_URL}/auth/logout`,
            {},
            { withCredentials: true }
        ).pipe(
            tap(() => {
                this.handleAuthFailure();
                this.router.navigate(['/']);
            }),
            catchError(error => {
                // Even if logout fails, clear local state
                this.handleAuthFailure();
                this.router.navigate(['/']);
                return throwError(() => error);
            })
        );
    }

    /**
     * Get current user profile
     */
    me(): Observable<User> {
        return this.http.get<UserResponse>(
            `${this.API_URL}/me`,
            { withCredentials: true }
        ).pipe(
            map(response => response.user),
            tap(user => {
                this.currentUserSubject.next(user);
            }),
            catchError(error => {
                console.error('Get user error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Get access token
     */
    getAccessToken(): string | null {
        return this.accessToken;
    }

    /**
     * Set access token (used by interceptor after refresh)
     */
    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.currentUserSubject.value !== null;
    }

    /**
     * Initialize auth state on app start
     * Attempts to refresh token if refresh cookie exists
     */
    initializeAuth(): Observable<boolean> {
        return this.refresh().pipe(
            tap(() => {
                // After successful refresh, fetch user profile
                this.me().subscribe();
            }),
            map(() => true),
            catchError(() => {
                // Refresh failed, user not authenticated
                return new Observable<boolean>(observer => {
                    observer.next(false);
                    observer.complete();
                });
            })
        );
    }

    /**
     * Handle successful authentication
     */
    private handleAuthSuccess(response: AuthResponse): void {
        this.accessToken = response.accessToken;
        this.currentUserSubject.next(response.user);
    }

    /**
     * Handle authentication failure (logout)
     */
    private handleAuthFailure(): void {
        this.accessToken = null;
        this.currentUserSubject.next(null);
    }
}
