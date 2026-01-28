import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SopinfoService } from '../../core/services/sopinfo.service';
import { Station, GuideArticle } from '../../core/models/sopinfo.models';
import { FavouritesService } from '../../core/services/favourites.service';
import { AuthService } from '../../core/services/auth.service';
import { StationDetailComponent } from '../../shared/components/station-detail.component';
import { Top10StationsPer10kComponent } from '../../shared/components/stats/top10-stations-per-10k.component';
import { GuideArticleDetailComponent } from '../../shared/components/guide-article-detail.component';


@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule, DialogModule, ButtonModule, StationDetailComponent, Top10StationsPer10kComponent],
    providers: [DialogService],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
    private sopinfoService = inject(SopinfoService);
    private router = inject(Router);
    private dialogService = inject(DialogService);
    public favoritesService = inject(FavouritesService);
    public authService = inject(AuthService);

    ref: DynamicDialogRef | undefined | null;

    searchQuery = signal('');
    isLoading = signal(false);
    nearestStation = signal<Station | null>(null);
    searchResults = signal<Station[]>([]);
    errorMessage = signal<string | null>(null);
    showSearchResults = signal(false);

    selectedStation = signal<Station | null>(null);
    showStationDetail = signal(false);

    wasteQuery = signal('');

    favoriteStations = computed(() => {
        const favoriteIds = this.favoritesService.favourites();
        const stations = this.sopinfoService.stations();

        if (!favoriteIds || favoriteIds.length === 0 || !stations || stations.length === 0) {
            return [];
        }

        return stations.filter(station => favoriteIds.includes(station.id.toString()));
    });

    private readonly SEARCH_RADIUS_KM = 10;

    constructor() { }

    ngOnInit() {
        this.loadAllStations();
    }

    private loadAllStations() {
        this.sopinfoService.loadStations().subscribe({
            error: (err) => console.error('Failed to load stations for favorites:', err)
        });
    }

    async onSearch() {
        if (!this.searchQuery()) return;
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.nearestStation.set(null);

        try {
            const location = await this.sopinfoService.geocode(this.searchQuery()).toPromise();

            if (location) {
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
            const location = await this.sopinfoService.getUserLocation();

            this.findNearestStation(location.latitude, location.longitude);

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



                const stationsWithDist = stations.map(s => {
                    s.distance = this.sopinfoService.calculateDistance(lat, lon, s.latitude, s.longitude);
                    return s;
                });
                const nearbyStations = stationsWithDist.filter(s => (s.distance || 0) <= this.SEARCH_RADIUS_KM);

                if (nearbyStations.length === 0) {
                    this.errorMessage.set(`Inga stationer hittades inom ${this.SEARCH_RADIUS_KM} km.`);
                    this.isLoading.set(false);
                    return;
                }

                nearbyStations.sort((a, b) => (a.distance || 0) - (b.distance || 0));


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



    openSortingModal(slug: string) {
        this.sopinfoService.getGuideArticle(slug).subscribe({
            next: (article) => {
                this.showArticleDialog(article);
            },
            error: (err) => {
                console.error('Failed to load article:', err);
                const fallbackArticle: GuideArticle = {
                    id: 0,
                    title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
                    slug: slug,
                    category: 'Information saknas',
                    excerpt: 'Detaljerad information om hur du sorterar denna fraktion kommer snart.',
                    description: undefined
                };
                this.showArticleDialog(fallbackArticle);
            }
        });
    }

    private showArticleDialog(article: GuideArticle) {
        this.ref = this.dialogService.open(GuideArticleDetailComponent, {
            header: article.title,
            width: '100%',
            style: { 'max-width': '800px' },
            styleClass: 'dynamic-dialog-custom',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: false,
            resizable: false,
            showHeader: false,
            data: {
                article: article
            },
            modal: true
        });
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
