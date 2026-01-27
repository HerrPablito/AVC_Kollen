import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Station } from '../../core/models/sopinfo.models';
import { FavoritesService } from '../services/favorites.service';

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

    constructor(public favoritesService: FavoritesService) { }

    isFavorite(): boolean {
        return this.station ? this.favoritesService.isFavorite(this.station.id) : false;
    }

    toggleFavorite(): void {
        if (this.station) {
            this.favoritesService.toggleFavorite(this.station);
        }
    }

    handleHide(): void {
        this.onHide.emit();
    }
}
