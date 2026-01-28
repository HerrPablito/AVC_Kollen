import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SopinfoService } from '../../core/services/sopinfo.service';
import { Station, GuideArticle } from '../../core/models/sopinfo.models';
import { FavouritesService } from '../../core/services/favourites.service';
import { AuthService } from '../../core/services/auth.service';
import { StationDetailComponent } from '../../shared/components/station-detail.component';


@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule, DialogModule, ButtonModule, StationDetailComponent],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
    private sopinfoService = inject(SopinfoService);
    private router = inject(Router);
    public favoritesService = inject(FavouritesService);
    public authService = inject(AuthService);

    searchQuery = signal('');
    isLoading = signal(false);
    nearestStation = signal<Station | null>(null);
    searchResults = signal<Station[]>([]);
    errorMessage = signal<string | null>(null);
    showSearchResults = signal(false);

    // Dialog State
    selectedArticle = signal<GuideArticle | null>(null);
    selectedStation = signal<Station | null>(null);
    showStationDetail = signal(false);

    // Quick Search "Vad vill du slänga?"
    wasteQuery = signal('');

    // All available stations (for mapping favorites)
    allStations = signal<Station[]>([]);

    // Computed Favorites with full Station objects
    favoriteStations = computed(() => {
        const favoriteIds = this.favoritesService.favourites();
        const stations = this.allStations();

        if (!favoriteIds || favoriteIds.length === 0 || !stations || stations.length === 0) {
            return [];
        }

        return stations.filter(station => favoriteIds.includes(station.id.toString()));
    });

    // Radius for search (in km) - 1 mil = ~10 km
    private readonly SEARCH_RADIUS_KM = 10;

    constructor() { }

    ngOnInit() {
        // Load all stations to map favorites
        this.loadAllStations();
    }

    private loadAllStations() {
        this.sopinfoService.getStations().subscribe({
            next: (stations) => {
                this.allStations.set(stations);
            },
            error: (err) => console.error('Failed to load stations for favorites:', err)
        });
    }

    async onSearch() {
        if (!this.searchQuery()) return;
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.nearestStation.set(null);

        try {
            // 1. Geocode postal code/city
            const location = await this.sopinfoService.geocode(this.searchQuery()).toPromise();

            if (location) {
                // 2. Fetch all stations and find nearest
                // Note: We might already have stations in allStations, but reusing existing logic for now
                this.findNearestStation(location.latitude, location.longitude);
            }
        } catch (error) {
            this.errorMessage.set('Kunde inte hitta platsen. Kontrollera stavningen.');
            this.isLoading.set(false);
        }
    }

    async useMyLocation() {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.nearestStation.set(null);

        try {
            // 1. Get user location
            const location = await this.sopinfoService.getUserLocation();

            // 2. Find nearest station
            this.findNearestStation(location.latitude, location.longitude);

            // Update search input to say "Min position" or similar? Optional.
        } catch (error) {
            this.errorMessage.set('Kunde inte hämta din position. Tillåt platsåtkomst eller sök manuellt.');
            this.isLoading.set(false);
        }
    }

    private findNearestStation(lat: number, lon: number) {
        // Use cached stations if available in service, or fetch
        this.sopinfoService.getStations().subscribe({
            next: (stations) => {
                if (!stations || stations.length === 0) {
                    this.errorMessage.set('Inga stationer hittades.');
                    this.isLoading.set(false);
                    return;
                }

                // Update allStations if not already set (side effect optimization)
                if (this.allStations().length === 0) {
                    this.allStations.set(stations);
                }

                // Calculate distances for all stations
                const stationsWithDist = stations.map(s => {
                    s.distance = this.sopinfoService.calculateDistance(lat, lon, s.latitude, s.longitude);
                    return s;
                });

                // Filter stations within 1 mil (10 km)
                const nearbyStations = stationsWithDist.filter(s => (s.distance || 0) <= this.SEARCH_RADIUS_KM);

                if (nearbyStations.length === 0) {
                    this.errorMessage.set(`Inga stationer hittades inom ${this.SEARCH_RADIUS_KM} km.`);
                    this.isLoading.set(false);
                    return;
                }

                // Sort by distance
                nearbyStations.sort((a, b) => (a.distance || 0) - (b.distance || 0));

                // Set results
                this.nearestStation.set(nearbyStations[0]);
                this.searchResults.set(nearbyStations);
                this.showSearchResults.set(true);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorMessage.set('Kunde inte hämta stationer. Försök igen senare.');
                this.isLoading.set(false);
            }
        });
    }

    navigateToStation(station: Station) {
        this.router.navigate(['/stationer'], { queryParams: { highlight: station.id } });
    }

    openSortingModal(slug: string) {
        console.log('Opening modal for slug:', slug);
        this.sopinfoService.getGuideArticle(slug).subscribe({
            next: (article) => {
                console.log('Article loaded:', article);
                this.selectedArticle.set(article);
            },
            error: (err) => {
                console.error('Failed to load article:', err);
                // Fallback content if API fails or slug is missing
                this.selectedArticle.set({
                    id: 0,
                    title: slug.charAt(0).toUpperCase() + slug.slice(1),
                    slug: slug,
                    category: '',
                    excerpt: 'Detaljerad information om hur du sorterar denna fraktion kommer snart.',
                    description: undefined
                });
            }
        });
    }

    closeModal() {
        this.selectedArticle.set(null);
    }

    openStationDialog(station: Station) {
        this.selectedStation.set(station);
        this.showStationDetail.set(true);
    }

    closeStationDialog() {
        this.selectedStation.set(null);
        this.showStationDetail.set(false);
    }

    toggleFavorite(station: Station | null | undefined, event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        if (station) {
            if (this.favoritesService.isFavourite(station.id.toString())) {
                this.favoritesService.removeFavourite(station.id.toString());
            } else {
                this.favoritesService.addFavourite(station.id.toString());
            }
        }
    }

    isFavorite(stationId: number | null | undefined): boolean {
        if (!stationId) {
            return false;
        }
        return this.favoritesService.isFavourite(stationId.toString());
    }

    onWasteSearch() {
        if (this.wasteQuery()) {
            this.router.navigate(['/sorteringsguide'], { queryParams: { search: this.wasteQuery() } });
        }
    }

    clearSearch() {
        this.searchQuery.set('');
        this.searchResults.set([]);
        this.nearestStation.set(null);
        this.showSearchResults.set(false);
        this.errorMessage.set(null);
    }
}
