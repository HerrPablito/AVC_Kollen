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
    styleUrl: './stations.component.scss' // We'll create this file next
})
export class StationsComponent implements OnInit {
    stations = signal<Station[]>([]);
    searchQuery = signal('');
    selectedStationId = signal<string | null>(null);
    isLoading = signal(true);

    // Filtered stations based on search query
    filteredStations = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const all = this.stations();
        if (!query) return all;

        return all.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.city.toLowerCase().includes(query) ||
            s.address.toLowerCase().includes(query)
        );
    });

    constructor(
        private sopinfoService: SopinfoService,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.loadStations();

        // Check for highlight query param
        this.route.queryParams.subscribe(params => {
            if (params['highlight']) {
                this.selectedStationId.set(params['highlight']);
                // Maybe scroll to element logic later?
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
            // Here we could fetch specific details efficiently if not already present
            // But user requirement said: "expandera... och hämta detaljer via GET /api/stationer/:id"
            // So let's do that if needed, or if we want to ensure fresh data.
            // Since simplistic getStations might return full data or summary, let's fetch details to be safe/compliant.
            this.fetchStationDetails(station.id);
        }
    }

    fetchStationDetails(id: string) {
        // Optimistic update of UI implies we expand immediately.
        // Fetching extra details could update the specific object in the signal array.
        this.sopinfoService.getStationDetails(id).subscribe(details => {
            this.stations.update(current =>
                current.map(s => s.id === id ? { ...s, ...details } : s)
            );
        });
    }

    // Helper for template
    objectKeys(obj: any): string[] {
        return obj ? Object.keys(obj) : [];
    }
}
