// TypeScript interfaces for sopinfo.se API

export interface Kommun {
    id: number;
    namn: string;
    slug: string;
    lan: string;
    stationer?: Station[];
}

export interface Station {
    id: number;
    namn: string;
    typ: 'ÅVC' | 'Återvinningsstation';
    adress: string;
    postnummer: string;
    ort: string;
    kommun_id: number;
    kommun?: string;
    latitude?: number;
    longitude?: number;
    oppettider?: string;
    telefon?: string;
    hemsida?: string;
}

export interface SorteringsguideArtikel {
    id: number;
    namn: string;
    slug: string;
    sammanfattning: string;
    innehall: string;
    kategori: string;
    ordning: number;
    bild_url?: string;
}

export interface ApiCounts {
    kommuner: number;
    stationer: number;
    sorteringsguide: number;
}

// Query parameters interfaces
export interface StationerQueryParams {
    limit?: number;
    offset?: number;
    kommun_id?: number;
    typ?: 'ÅVC' | 'Återvinningsstation';
    orderBy?: 'namn' | 'typ' | 'ort' | 'kommun_id';
    order?: 'ASC' | 'DESC';
}

export interface SorteringsguideQueryParams {
    limit?: number;
    offset?: number;
    search?: string;
    kategori?: string;
    orderBy?: 'namn' | 'ordning' | 'kategori';
}
