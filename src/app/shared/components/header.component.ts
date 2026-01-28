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



    selectedFavorite: Station | null = null;




    favoriteStations = computed(() => {
        const favoriteIds = this.favoritesService.favourites();
        const stations = this.sopinfoService.stations();

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
        this.sopinfoService.loadStations().subscribe({
            error: (err) => console.error('Failed to load stations for header favorites:', err)
        });
    }

    navigateHome() {
        this.router.navigate(['/']);
        window.scrollTo(0, 0);
    }



    onStationSelect(event: any) {
        const station = event?.value;
        if (station) {
            this.selectedStation.set(station);
            this.showStationDetail.set(true);


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


    getFavoritesList(): Station[] {
        return this.favoriteStations();
    }
}
