import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, map, catchError, throwError } from 'rxjs';
import { Station, GuideArticle, GeoLocation } from '../models/sopinfo.models';

@Injectable({
    providedIn: 'root'
})
export class SopinfoService {
    private readonly API_BASE = 'https://sopinfo.se/api';

    // Public signal for stations to avoid multiple subscriptions/state in components
    public stations = signal<Station[]>([]);

    constructor(private http: HttpClient) { }

    loadStations(): Observable<Station[]> {
        if (this.stations().length > 0) {
            return of(this.stations());
        }

        return this.http.get<{ success: boolean; data: any[] }>(`${this.API_BASE}/stationer?limit=10000`).pipe(
            map(response => this.mapStations(response.data)),
            tap(stations => this.stations.set(stations)),
            catchError(err => {
                console.error('Sopinfo API Error (Stations):', err);
                return throwError(() => err);
            })
        );
    }

    // Deprecated: Use loadStations() and access stations() signal instead
    getStations(): Observable<Station[]> {
        return this.loadStations();
    }

    getStationDetails(id: number): Observable<Station> {
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
            id: item.id,
            name: item.namn || item.name || '',
            address: item.adress || item.address || '',
            city: item.ort || item.city || undefined,
            postal_code: item.postnummer || item.zip || undefined,
            latitude: parseFloat(item.lat || item.latitude || '0'),
            longitude: parseFloat(item.lng || item.longitude || '0'),
            type: item.typ || 'ÅVC',

            // Contact & Info
            phone: item.telefon || undefined,
            email: item.email || undefined,
            website: item.webbplats || undefined,
            description: item.beskrivning || undefined,
            opening_info: item.oppet_info || undefined,

            // Facilities
            parking: item.parkering === 1 || item.parkering === true,
            toilet: item.toalett === 1 || item.toalett === true,
            cafe: item.cafe === 1 || item.cafe === true,
            accessibility: item.tillganglighet || undefined,

            // Metadata
            municipality_id: item.kommun_id || undefined,
            municipality_name: item.kommun_name || undefined,
            status: item.status || undefined
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
