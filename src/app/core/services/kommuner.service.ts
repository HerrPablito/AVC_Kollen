import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { Kommun } from '../models/sopinfo.models';

export interface EnrichedKommun extends Kommun {
    stationsPer10k: number;
}

@Injectable({
    providedIn: 'root'
})
export class KommunerService {
    private readonly API_URL = 'https://sopinfo.se/api/kommuner';

    // Cache the Observable to prevent multiple requests
    private kommunerData$: Observable<EnrichedKommun[]> | null = null;

    constructor(private http: HttpClient) { }

    getKommunerStats(): Observable<EnrichedKommun[]> {
        if (!this.kommunerData$) {
            this.kommunerData$ = this.http.get<{ success: boolean; data: any[] }>(this.API_URL).pipe(
                map(response => {
                    if (!response.data) return [];

                    return response.data
                        // Map structure if needed, or assume it matches Kommun + calculations
                        .map((k: any) => {
                            const stationCount = k.station_count || 0;
                            const population = k.befolkning || 0;

                            // Prevent division by zero
                            const stats = population > 0
                                ? (stationCount / population) * 10000
                                : 0;

                            return {
                                ...k,
                                station_count: stationCount,
                                befolkning: population,
                                stationsPer10k: stats
                            } as EnrichedKommun;
                        })
                        // Filter invalid data
                        .filter((k: EnrichedKommun) => k.befolkning > 0 && k.station_count != null)
                        // Sort by stationsPer10k descending
                        .sort((a: EnrichedKommun, b: EnrichedKommun) => b.stationsPer10k - a.stationsPer10k);
                }),
                shareReplay(1),
                catchError(err => {
                    console.error('Failed to fetch kommuner:', err);
                    return throwError(() => err);
                })
            );
        }
        return this.kommunerData$;
    }

    getTop10Per10k(): Observable<EnrichedKommun[]> {
        return this.getKommunerStats().pipe(
            map(kommuner => kommuner.slice(0, 10))
        );
    }
}
