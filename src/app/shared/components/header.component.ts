import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../services/favorites.service';
import { StationDetailComponent } from './station-detail.component';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { Station } from '../../core/models/sopinfo.models';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, CommonModule, StationDetailComponent, ButtonModule, SelectModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
    selectedStation = signal<Station | null>(null);
    showStationDetail = signal(false);

    constructor(
        private router: Router,
        public favoritesService: FavoritesService
    ) { }

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
        }
    }
}
