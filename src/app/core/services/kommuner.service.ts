import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, shareReplay, throwError } from 'rxjs';
import { Kommun } from '../models/sopinfo.models';
import { SopinfoService } from './sopinfo.service';

export interface EnrichedKommun extends Kommun {
    stationsPer10k: number;
}

@Injectable({
    providedIn: 'root'
})
export class KommunerService {
    private readonly API_URL = 'https://sopinfo.se/api/kommuner';
    private sopinfoService = inject(SopinfoService);

    // Cache the Observable to prevent multiple requests
    private kommunerData$: Observable<EnrichedKommun[]> | null = null;

    constructor(private http: HttpClient) { }

    getKommunerStats(): Observable<EnrichedKommun[]> {
        if (!this.kommunerData$) {
            this.kommunerData$ = forkJoin({
                kommuner: this.http.get<{ success: boolean; data: any[] }>(this.API_URL),
                stations: this.sopinfoService.loadStations()
            }).pipe(
                map(({ kommuner, stations }) => {
                    const kommunerList = kommuner.data || [];

                    // 1. Calculate station counts per municipality
                    const stationCounts = new Map<number, number>();
                    stations.forEach(station => {
                        if (station.municipality_id) {
                            const current = stationCounts.get(station.municipality_id) || 0;
                            stationCounts.set(station.municipality_id, current + 1);
                        }
                    });

                    // 2. Enrich municipality data
                    return kommunerList
                        .map((k: any) => {
                            // Match by ID. Note: verify if API returns 'id' or 'kommun_id' in kommuner list
                            // Usually it's 'id' in the kommuner endpoint.
                            const count = stationCounts.get(k.id) || 0;
                            const population = k.befolkning || 0;

                            // Prevent division by zero
                            const stats = population > 0
                                ? (count / population) * 10000
                                : 0;

                            return {
                                ...k,
                                station_count: count,
                                befolkning: population,
                                stationsPer10k: stats
                            } as EnrichedKommun;
                        })
                        // 3. Filter invalid data (must have population AND stations)
                        .filter((k: EnrichedKommun) => k.befolkning > 0 && k.station_count > 0)
                        // 4. Sort by stationsPer10k descending
                        .sort((a: EnrichedKommun, b: EnrichedKommun) => b.stationsPer10k - a.stationsPer10k);
                }),
                shareReplay(1),
                catchError(err => {
                    console.error('Failed to fetch stats:', err);
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
