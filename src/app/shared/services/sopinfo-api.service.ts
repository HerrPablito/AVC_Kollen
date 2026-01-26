import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    ApiCounts,
    Kommun,
    Station,
    SorteringsguideArtikel,
    StationerQueryParams,
    SorteringsguideQueryParams
} from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class SopinfoApiService {
    private readonly baseUrl = 'https://sopinfo.se/api';

    constructor(private http: HttpClient) { }

    // Counts
    getCounts(): Observable<ApiCounts> {
        return this.http.get<ApiCounts>(`${this.baseUrl}/counts`);
    }

    // Kommuner
    getKommuner(): Observable<Kommun[]> {
        return this.http.get<Kommun[]>(`${this.baseUrl}/kommuner`);
    }

    getKommun(slug: string): Observable<Kommun> {
        return this.http.get<Kommun>(`${this.baseUrl}/kommuner/${slug}`);
    }

    // Stationer
    getStationer(params?: StationerQueryParams): Observable<Station[]> {
        let httpParams = new HttpParams();

        if (params) {
            if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
            if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
            if (params.kommun_id) httpParams = httpParams.set('kommun_id', params.kommun_id.toString());
            if (params.typ) httpParams = httpParams.set('typ', params.typ);
            if (params.orderBy) httpParams = httpParams.set('orderBy', params.orderBy);
            if (params.order) httpParams = httpParams.set('order', params.order);
        }

        return this.http.get<Station[]>(`${this.baseUrl}/stationer`, { params: httpParams });
    }

    getStation(id: number): Observable<Station> {
        return this.http.get<Station>(`${this.baseUrl}/stationer/${id}`);
    }

    // Sorteringsguide
    getSorteringsguide(params?: SorteringsguideQueryParams): Observable<SorteringsguideArtikel[]> {
        let httpParams = new HttpParams();

        if (params) {
            if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
            if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
            if (params.search) httpParams = httpParams.set('search', params.search);
            if (params.kategori) httpParams = httpParams.set('kategori', params.kategori);
            if (params.orderBy) httpParams = httpParams.set('orderBy', params.orderBy);
        }

        return this.http.get<SorteringsguideArtikel[]>(`${this.baseUrl}/sorteringsguide`, { params: httpParams });
    }

    getSorteringsguideArtikel(slug: string): Observable<SorteringsguideArtikel> {
        return this.http.get<SorteringsguideArtikel>(`${this.baseUrl}/sorteringsguide/${slug}`);
    }
}
