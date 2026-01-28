import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SopinfoService } from '../../core/services/sopinfo.service';
import { Station } from '../../core/models/sopinfo.models';

@Component({
    selector: 'app-stations',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stations.component.html',
    styleUrl: './stations.component.scss'
})
export class StationsComponent implements OnInit {
    stations = signal<Station[]>([]);
    searchQuery = signal('');
    selectedStationId = signal<number | null>(null);
    isLoading = signal(true);

    filteredStations = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const all = this.stations();
        if (!query) return all;

        return all.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.city?.toLowerCase().includes(query) ||
            s.address.toLowerCase().includes(query)
        );
    });

    constructor(
        private sopinfoService: SopinfoService,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.loadStations();

        this.route.queryParams.subscribe(params => {
            if (params['highlight']) {
                this.selectedStationId.set(params['highlight']);
            }
        });
    }

    loadStations() {
        this.isLoading.set(true);
        this.sopinfoService.getStations().subscribe({
            next: (data) => {
                this.stations.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Failed to load stations', err);
                this.isLoading.set(false);
            }
        });
    }

    toggleDetails(station: Station) {
        if (this.selectedStationId() === station.id) {
            this.selectedStationId.set(null);
        } else {
            this.selectedStationId.set(station.id);
            this.fetchStationDetails(station.id);
        }
    }

    fetchStationDetails(id: number) {
        this.sopinfoService.getStationDetails(id).subscribe(details => {
            this.stations.update(current =>
                current.map(s => s.id === id ? { ...s, ...details } : s)
            );
        });
    }

    objectKeys(obj: any): string[] {
        return obj ? Object.keys(obj) : [];
    }
}
