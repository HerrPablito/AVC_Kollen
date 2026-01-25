import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, map, catchError, throwError } from 'rxjs';
import { Station, GuideArticle, GeoLocation } from '../models/sopinfo.models';

@Injectable({
    providedIn: 'root'
})
export class SopinfoService {
    private readonly API_BASE = 'https://sopinfo.se/api';

    // Cache signals
    private stationsCache = signal<Station[] | null>(null);

    constructor(private http: HttpClient) { }

    // --- API Methods ---

    getStations(): Observable<Station[]> {
        if (this.stationsCache()) {
            return of(this.stationsCache()!);
        }

        return this.http.get<{ success: boolean; data: any[] }>(`${this.API_BASE}/stationer`).pipe(
            tap(response => console.log('Sopinfo API: Fetched stations', response.data?.length)),
            map(response => this.mapStations(response.data)),
            tap(stations => this.stationsCache.set(stations)),
            catchError(err => {
                console.error('Sopinfo API Error (Stations):', err);
                return throwError(() => err);
            })
        );
    }

    getStationDetails(id: string): Observable<Station> {
        return this.http.get<{ success: boolean; data: any }>(`${this.API_BASE}/stationer/${id}`).pipe(
            map(response => this.mapStation(response.data)),
            catchError(err => {
                console.error(`Sopinfo API Error (Station ${id}):`, err);
                return throwError(() => err);
            })
        );
    }

    getSortingGuide(search?: string): Observable<GuideArticle[]> {
        let params = new HttpParams();
        if (search) {
            params = params.set('search', search);
        }
        return this.http.get<{ success: boolean; data: any[] }>(`${this.API_BASE}/sorteringsguide`, { params }).pipe(
            tap(response => console.log('Sopinfo API: Fetched guide articles', response.data?.length)),
            map(response => this.mapArticles(response.data)),
            catchError(err => {
                console.error('Sopinfo API Error (Sorting Guide):', err);
                return throwError(() => err);
            })
        );
    }

    getGuideArticle(slug: string): Observable<GuideArticle> {
        return this.http.get<{ success: boolean; data: any }>(`${this.API_BASE}/sorteringsguide/${slug}`).pipe(
            map(response => this.mapArticle(response.data)),
            catchError(err => {
                console.error(`Sopinfo API Error (Guide Article ${slug}):`, err);
                return throwError(() => err);
            })
        );
    }

    // --- Helper Methods ---

    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    getUserLocation(): Promise<GeoLocation> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('Geolocation not supported');
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    (error) => {
                        reject(error);
                    }
                );
            }
        });
    }

    geocode(postalCode: string): Observable<GeoLocation> {
        return this.http.get<any[]>('https://nominatim.openstreetmap.org/search', {
            params: {
                format: 'json',
                q: `${postalCode}, Sweden`,
                limit: '1'
            }
        }).pipe(
            map(results => {
                if (results && results.length > 0) {
                    return {
                        latitude: parseFloat(results[0].lat),
                        longitude: parseFloat(results[0].lon)
                    };
                }
                throw new Error('Geocoding failed');
            })
        );
    }

    // --- Mappers ---

    private mapStations(data: any[]): Station[] {
        return (data || []).map(item => this.mapStation(item));
    }

    private mapStation(item: any): Station {
        return {
            id: item.id || item.station_id,
            name: item.namn || item.name,
            address: item.adress || item.address,
            city: item.ort || item.city,
            postal_code: item.postnummer || item.zip,
            latitude: parseFloat(item.latitude || item.lat),
            longitude: parseFloat(item.longitude || item.lon),
            type: item.typ || 'avc',
            services: item.services || [],
            opening_hours: item.oppettider
        };
    }

    private mapArticles(data: any[]): GuideArticle[] {
        return (data || []).map(item => this.mapArticle(item));
    }

    private mapArticle(item: any): GuideArticle {
        // Helper to safely parse JSON strings
        const parseJsonField = (field: string | null): any => {
            if (!field) return undefined;
            try {
                return JSON.parse(field);
            } catch {
                return undefined;
            }
        };

        return {
            id: item.id,
            title: item.namn || item.title,
            slug: item.slug,
            category: item.kategori || '',
            excerpt: item.sammanfattning || item.excerpt || '',
            description: item.beskrivning || undefined,
            image_url: item.bild_url || undefined,

            // Parse JSON fields
            allowed: parseJsonField(item.tillat),
            not_allowed: parseJsonField(item.ej_tillat),
            tips: parseJsonField(item.tips_json),
            common_mistakes: item.vanliga_fel || undefined,
            why_text: item.varfor_text || undefined,

            // Parse color and icon objects
            color: parseJsonField(item.farger),
            icon: parseJsonField(item.ikoner),

            // Metadata
            order: item.ordning,
            status: item.status
        };
    }
}
