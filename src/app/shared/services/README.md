# Sopinfo API Service

API-service för att hämta data från sopinfo.se.

## Användning

```typescript
import { SopinfoApiService } from './shared/services/sopinfo-api.service';

constructor(private sopinfoApi: SopinfoApiService) {}

// Hämta alla kommuner
this.sopinfoApi.getKommuner().subscribe(kommuner => {
  console.log(kommuner);
});

// Sök i sorteringsguiden
this.sopinfoApi.getSorteringsguide({ search: 'batteri' }).subscribe(artiklar => {
  console.log(artiklar);
});

// Hämta stationer för en kommun
this.sopinfoApi.getStationer({ kommun_id: 123 }).subscribe(stationer => {
  console.log(stationer);
});
```

## Endpoints

### Counts
- `getCounts()` - Hämta statistik över antal poster

### Kommuner
- `getKommuner()` - Lista alla kommuner
- `getKommun(slug)` - Hämta specifik kommun med stationer

### Stationer
- `getStationer(params?)` - Lista stationer med filtrering
  - `limit` - Max antal resultat (1-5000, default: 20)
  - `offset` - Hoppa över N första resultaten
  - `kommun_id` - Filtrera på kommun-ID
  - `typ` - Filtrera på typ ("ÅVC" eller "Återvinningsstation")
  - `orderBy` - Sortera på: namn, typ, ort, kommun_id
  - `order` - Sorteringsordning: ASC eller DESC
- `getStation(id)` - Hämta specifik station

### Sorteringsguide
- `getSorteringsguide(params?)` - Lista sorteringsguide-artiklar
  - `limit` - Max antal resultat (default: 20)
  - `offset` - Hoppa över N första resultaten
  - `search` - Sök i artikelnamn och sammanfattning
  - `kategori` - Filtrera på kategori
  - `orderBy` - Sortera på: namn, ordning, kategori
- `getSorteringsguideArtikel(slug)` - Hämta specifik artikel

## Models

Se `shared/models/api.models.ts` för TypeScript-interfaces:
- `Kommun`
- `Station`
- `SorteringsguideArtikel`
- `ApiCounts`
- `StationerQueryParams`
- `SorteringsguideQueryParams`
