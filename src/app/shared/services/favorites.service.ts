import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { Station } from '../../core/models/sopinfo.models';

@Injectable({
    providedIn: 'root'
})
export class FavoritesService {
    private readonly STORAGE_KEY = 'avc_favorites';
    
    // Signal to track favorites reactively
    favorites = signal<Station[]>([]);

    constructor() {
        this.loadFavorites();
    }

    /**
     * Load favorites from localStorage
     */
    private loadFavorites(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const favoriteStations = stored ? JSON.parse(stored) : [];
            // Validate that each item has an id property
            const validStations = favoriteStations.filter(
                (s: any) => s && typeof s === 'object' && s.id !== undefined && s.id !== null
            );
            this.favorites.set(validStations);
        } catch (error) {
            console.error('Error loading favorites:', error);
            this.favorites.set([]);
        }
    }

    /**
     * Save favorites to localStorage
     */
    private saveFavorites(stations: Station[]): void {
        try {
            // Store the full Station objects, not just IDs
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stations));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    /**
     * Add a station to favorites
     */
    addFavorite(station: Station | null | undefined): void {
        if (!station || !station.id) {
            return;
        }
        const current = this.favorites();
        const exists = current.some(s => s.id === station.id);
        
        if (!exists) {
            this.favorites.set([...current, station]);
            this.saveFavorites([...current, station]);
        }
    }

    /**
     * Remove a station from favorites
     */
    removeFavorite(stationId: number): void {
        const current = this.favorites();
        const updated = current.filter(s => s.id !== stationId);
        this.favorites.set(updated);
        this.saveFavorites(updated);
    }

    /**
     * Check if a station is favorited
     */
    isFavorite(stationId: number): boolean {
        return this.favorites().some(s => s.id === stationId);
    }

    /**
     * Toggle favorite status
     */
    toggleFavorite(station: Station | null | undefined): void {
        if (!station || !station.id) {
            return;
        }
        if (this.isFavorite(station.id)) {
            this.removeFavorite(station.id);
        } else {
            this.addFavorite(station);
        }
    }

    /**
     * Get all favorites
     */
    getFavorites(): Station[] {
        return this.favorites();
    }

    /**
     * Clear all favorites
     */
    clearFavorites(): void {
        this.favorites.set([]);
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
