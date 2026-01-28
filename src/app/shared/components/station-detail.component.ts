import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Station } from '../../core/models/sopinfo.models';
import { FavouritesService } from '../../core/services/favourites.service';

@Component({
    selector: 'app-station-detail',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    templateUrl: './station-detail.component.html',
    styleUrl: './station-detail.component.scss'
})
export class StationDetailComponent {
    @Input() station: Station | null = null;
    @Input() visible = false;
    @Output() onHide = new EventEmitter<void>();

    constructor(public favoritesService: FavouritesService) { }

    isFavorite(): boolean {
        return this.station ? this.favoritesService.isFavourite(this.station.id.toString()) : false;
    }

    toggleFavorite(): void {
        if (this.station) {
            this.favoritesService.toggleFavourite(this.station.id.toString());
        }
    }

    handleHide(): void {
        this.onHide.emit();
    }
}
