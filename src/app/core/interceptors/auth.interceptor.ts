import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Clone request and add Authorization header if token exists
    const token = authService.getAccessToken();
    let authReq = req;

    if (token) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    // Handle the request
    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Handle 401 Unauthorized errors
            if (error.status === 401 && !isRefreshing) {
                // Prevent multiple refresh attempts
                isRefreshing = true;

                // Attempt to refresh the token
                return authService.refresh().pipe(
                    switchMap((newToken: string) => {
                        // Reset refresh flag
                        isRefreshing = false;

                        // Retry the original request with new token
                        const retryReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${newToken}`
                            }
                        });

                        return next(retryReq);
                    }),
                    catchError((refreshError) => {
                        // Refresh failed, reset flag and logout
                        isRefreshing = false;

                        // Clear auth state and redirect to login
                        authService.logout().subscribe();
                        router.navigate(['/login']);

                        return throwError(() => refreshError);
                    })
                );
            }

            // For other errors or if already refreshing, just pass through
            return throwError(() => error);
        })
    );
};
