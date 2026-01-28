import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { KommunerService, EnrichedKommun } from '../../../core/services/kommuner.service';

@Component({
    selector: 'app-top10-stations-per-10k',
    standalone: true,
    imports: [CommonModule, ChartModule, SkeletonModule],
    templateUrl: './top10-stations-per-10k.component.html',
    styleUrl: './top10-stations-per-10k.component.scss'
})
export class Top10StationsPer10kComponent implements OnInit {
    private kommunerService = inject(KommunerService);

    // Signals for state
    isLoading = signal(true);
    hasError = signal(false);

    // Chart data
    chartData: any;
    chartOptions: any;

    ngOnInit() {
        this.initChartOptions();
        this.loadData();
    }

    private loadData() {
        this.kommunerService.getTop10Per10k().subscribe({
            next: (data) => {
                this.setupChartData(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.hasError.set(true);
                this.isLoading.set(false);
            }
        });
    }

    private setupChartData(kommuner: EnrichedKommun[]) {
        const labels = kommuner.map(k => k.name);
        // Round to 1 decimal
        const dataValues = kommuner.map(k => parseFloat(k.stationsPer10k.toFixed(1)));

        // Extra data for tooltips
        const rawData = kommuner;

        this.chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Stationer per 10 000 invånare',
                    data: dataValues,
                    backgroundColor: 'rgba(226, 59, 78, 0.7)', // --accent-0 with opacity
                    borderColor: '#e23b4e', // --accent-0
                    borderWidth: 1,
                    // Store raw data references if needed for advanced callbacks, 
                    // though tooltip callback usually uses index
                    rawData: rawData
                }
            ]
        };
    }

    private initChartOptions() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-0') || '#f6f0f4';
        const textColorSecondary = documentStyle.getPropertyValue('--text-1') || '#a0a0a0';
        const surfaceBorder = documentStyle.getPropertyValue('--border-0') || 'rgba(255,255,255,0.1)';

        this.chartOptions = {
            indexAxis: 'y', // Horizontal bars
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: (context: any) => {
                            // Find the corresponding municipality object
                            const index = context.dataIndex;
                            const dataset = context.dataset;
                            // We can use the index to find the original data from the input array if stored,
                            // or we can attach it to the dataset.
                            // Accessing via the component instance is hard here because of 'this' binding.
                            // But we stored rawData in the dataset above!
                            const kommun = dataset.rawData[index] as EnrichedKommun;

                            return [
                                `Antal stationer: ${kommun.station_count}`,
                                `Befolkning: ${kommun.befolkning.toLocaleString('sv-SE')}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };
    }
}
