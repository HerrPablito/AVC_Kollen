import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../../shared/maps/map';
import { SopinfoService } from '../../core/services/sopinfo.service';
import { Station } from '../../core/models/sopinfo.models';

@Component({
    selector: 'app-map-page',
    standalone: true,
    imports: [CommonModule, MapComponent],
    templateUrl: './map-page.html',
})
export class MapPageComponent implements OnInit {
    private sopinfoService = inject(SopinfoService);

    stations = signal<Station[]>([]);
    isLoading = signal(true);

    ngOnInit() {
        this.loadStations();
    }

    private loadStations() {
        this.isLoading.set(true);
        this.sopinfoService.loadStations().subscribe({ // Ensure stations are loaded
            next: () => {
                this.sopinfoService.getStations().subscribe({
                    next: (data) => {
                        this.stations.set(data);
                        this.isLoading.set(false);
                    },
                    error: (err) => {
                        console.error(err);
                        this.isLoading.set(false);
                    }
                })
            },
            error: (err) => {
                this.isLoading.set(false);
                console.error('Failed to init stations', err);
            }
        });
    }
}
