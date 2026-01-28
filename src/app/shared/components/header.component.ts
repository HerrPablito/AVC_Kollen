import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavouritesService } from '../../core/services/favourites.service';
import { SopinfoService } from '../../core/services/sopinfo.service';
import { StationDetailComponent } from './station-detail.component';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { Station } from '../../core/models/sopinfo.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, CommonModule, FormsModule, StationDetailComponent, ButtonModule, SelectModule, DrawerModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
    private sopinfoService = inject(SopinfoService);
    private router = inject(Router);
    public favoritesService = inject(FavouritesService);
    public authService = inject(AuthService);

    selectedStation = signal<Station | null>(null);
    showStationDetail = signal(false);
    showMobileMenu = signal(false);


    // Model for the p-select to allow resetting
    selectedFavorite: Station | null = null;

    // All available stations (for mapping favorites)
    allStations = signal<Station[]>([]);

    // Computed Favorites with full Station objects for the dropdown
    favoriteStations = computed(() => {
        const favoriteIds = this.favoritesService.favourites();
        const stations = this.allStations();

        if (!favoriteIds || favoriteIds.length === 0 || !stations || stations.length === 0) {
            return [];
        }

        return stations.filter(station => favoriteIds.includes(station.id.toString()));
    });

    constructor() { }

    ngOnInit() {
        this.loadAllStations();
    }

    private loadAllStations() {
        this.sopinfoService.getStations().subscribe({
            next: (stations) => {
                this.allStations.set(stations);
            },
            error: (err) => console.error('Failed to load stations for header favorites:', err)
        });
    }

    navigateHome() {
        this.router.navigate(['/']);
        // Scroll to top
        window.scrollTo(0, 0);
    }

    selectStation(station: Station | null) {
        if (station) {
            this.selectedStation.set(station);
            this.showStationDetail.set(true);
        }
    }

    onStationSelect(event: any) {
        const station = event?.value;
        if (station) {
            this.selectedStation.set(station);
            this.showStationDetail.set(true);

            // Reset selection immediately so "Mina ÅVC" placeholder returns
            // and the same station can be selected again
            setTimeout(() => {
                this.selectedFavorite = null;
            }, 100);
        }
    }

    logout(): void {
        this.authService.logout().subscribe({
            next: () => {
                this.router.navigate(['/']);
            }
        });
    }

    // Helper for template to consistently access favorites list
    getFavoritesList(): Station[] {
        return this.favoriteStations();
    }
}
