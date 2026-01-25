export interface Station {
    id: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
    latitude: number;
    longitude: number;
    type: string; // 'avc', 'ftm', etc.
    services?: string[];
    opening_hours?: Record<string, string>;
    distance?: number; // Calculated client-side
}

export interface GuideArticle {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    fractions: string[];
    image_url?: string;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
}
