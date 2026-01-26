export interface Station {
    id: number;
    name: string;
    address: string;
    city?: string;
    postal_code?: string;
    latitude: number;
    longitude: number;
    type: string; // 'ÅVC', etc.

    // Contact & Info
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    opening_info?: string;

    // Facilities
    parking?: boolean;
    toilet?: boolean;
    cafe?: boolean;
    accessibility?: string;

    // Metadata
    municipality_id?: number;
    municipality_name?: string;
    status?: string;

    // Client-side calculated
    distance?: number;
}

export interface GuideArticle {
    id: number;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    description?: string;
    image_url?: string;

    // Sorting information
    allowed?: string[];        // tillat - items that can be recycled
    not_allowed?: string[];    // ej_tillat - items that cannot be recycled
    tips?: string[];           // tips_json - practical tips
    common_mistakes?: string; // vanliga_fel - common mistakes
    why_text?: string;        // varfor_text - environmental impact

    // Visual/categorization
    color?: {
        name: string;
        primary: string;
    };
    icon?: {
        symbol: string;
        color_code: string;
        color_name: string;
    };

    // Metadata
    order?: number;
    status?: string;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
}
