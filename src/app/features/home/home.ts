import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SopinfoService } from '../../core/services/sopinfo.service';
import { Station, GuideArticle } from '../../core/models/sopinfo.models';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class HomeComponent {
    searchQuery = signal('');
    isLoading = signal(false);
    nearestStation = signal<Station | null>(null);
    errorMessage = signal<string | null>(null);

    // Sorting Modal State
    selectedArticle = signal<GuideArticle | null>(null);

    // Quick Search "Vad vill du slänga?"
    wasteQuery = signal('');

    constructor(
        private sopinfoService: SopinfoService,
        private router: Router
    ) { }

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
        this.sopinfoService.getStations().subscribe({
            next: (stations) => {
                if (!stations || stations.length === 0) {
                    this.errorMessage.set('Inga stationer hittades.');
                    this.isLoading.set(false);
                    return;
                }

                // Calculate distances
                const stationsWithDist = stations.map(s => {
                    s.distance = this.sopinfoService.calculateDistance(lat, lon, s.latitude, s.longitude);
                    return s;
                });

                // Sort by distance
                stationsWithDist.sort((a, b) => (a.distance || 0) - (b.distance || 0));

                // Set nearest
                this.nearestStation.set(stationsWithDist[0]);
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
        this.sopinfoService.getGuideArticle(slug).subscribe({
            next: (article) => {
                this.selectedArticle.set(article);
            },
            error: () => {
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

    onWasteSearch() {
        if (this.wasteQuery()) {
            this.router.navigate(['/sorteringsguide'], { queryParams: { search: this.wasteQuery() } });
        }
    }
}
