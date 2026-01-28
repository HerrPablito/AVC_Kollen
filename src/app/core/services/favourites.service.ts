import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, switchMap, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FavouritesService {
    private readonly STORAGE_KEY = 'avc_favourites';
    private readonly API_URL = environment.apiUrl;

    favourites = signal<string[]>([]);

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
        this.loadFavourites();

        // Listen to auth state changes
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                // User logged in - migrate and load from DB
                this.migrateLocalStorageToDb();
            } else {
                // User logged out - load from localStorage
                this.loadFromLocalStorage();
            }
        });
    }

    /**
     * Load favourites based on auth state
     */
    private loadFavourites(): void {
        if (this.authService.isAuthenticated()) {
            this.loadFromDb().subscribe();
        } else {
            this.loadFromLocalStorage();
        }
    }

    /**
     * Load from localStorage (guest mode)
     */
    private loadFromLocalStorage(): void {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const favourites = stored ? JSON.parse(stored) : [];
        this.favourites.set(favourites);
    }

    /**
     * Load from database (authenticated mode)
     */
    private loadFromDb(): Observable<string[]> {
        return this.http.get<{ favorites: string[] }>(`${this.API_URL}/favorites`).pipe(
            tap(response => {
                this.favourites.set(response.favorites);
            }),
            switchMap(response => of(response.favorites)),
            catchError(error => {
                console.error('Failed to load favorites from DB:', error);
                // Fallback to localStorage on error
                this.loadFromLocalStorage();
                return of([]);
            })
        );
    }

    /**
     * Migrate localStorage favorites to database on login
     */
    private migrateLocalStorageToDb(): void {
        const localFavourites = this.getLocalStorageFavourites();

        if (localFavourites.length > 0) {
            // Send to backend
            this.http.post(`${this.API_URL}/favorites/bulk`, {
                avcIds: localFavourites
            }).subscribe({
                next: () => {
                    console.log(`✅ ${localFavourites.length} favorites migrated to database`);
                    // Clear localStorage after successful migration
                    localStorage.removeItem(this.STORAGE_KEY);
                    // Reload from DB to get merged favorites
                    this.loadFromDb().subscribe();
                },
                error: (error) => {
                    console.error('Migration failed:', error);
                    // Keep localStorage as fallback
                }
            });
        } else {
            // No local favorites, just load from DB
            this.loadFromDb().subscribe();
        }
    }

    /**
     * Get favorites from localStorage without updating signal
     */
    private getLocalStorageFavourites(): string[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Add favourite
     */
    addFavourite(avcId: string): void {
        if (this.authService.isAuthenticated()) {
            // Add to database
            this.http.post(`${this.API_URL}/favorites`, { avcId }).subscribe({
                next: () => {
                    const current = this.favourites();
                    if (!current.includes(avcId)) {
                        this.favourites.set([...current, avcId]);
                    }
                },
                error: (error) => {
                    console.error('Failed to add favorite:', error);
                }
            });
        } else {
            // Add to localStorage
            const current = this.favourites();
            if (!current.includes(avcId)) {
                const updated = [...current, avcId];
                this.favourites.set(updated);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
            }
        }
    }

    /**
     * Remove favourite
     */
    removeFavourite(avcId: string): void {
        if (this.authService.isAuthenticated()) {
            // Remove from database
            this.http.delete(`${this.API_URL}/favorites/${avcId}`).subscribe({
                next: () => {
                    const current = this.favourites();
                    this.favourites.set(current.filter(id => id !== avcId));
                },
                error: (error) => {
                    console.error('Failed to remove favorite:', error);
                }
            });
        } else {
            // Remove from localStorage
            const current = this.favourites();
            const updated = current.filter(id => id !== avcId);
            this.favourites.set(updated);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
        }
    }

    /**
     * Check if AVC is favourite
     */
    isFavourite(avcId: string): boolean {
        return this.favourites().includes(avcId);
    }

    /**
     * Toggle favourite status
     */
    toggleFavourite(avcId: string): void {
        if (this.isFavourite(avcId)) {
            this.removeFavourite(avcId);
        } else {
            this.addFavourite(avcId);
        }
    }

    /**
     * Get all favourites
     */
    getFavourites(): string[] {
        return this.favourites();
    }

    /**
     * Clear all favourites
     */
    clearFavourites(): void {
        if (this.authService.isAuthenticated()) {
            // Clear from database
            this.http.delete(`${this.API_URL}/favorites`).subscribe({
                next: () => {
                    this.favourites.set([]);
                },
                error: (error) => {
                    console.error('Failed to clear favorites:', error);
                }
            });
        } else {
            // Clear from localStorage
            this.favourites.set([]);
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }
}
