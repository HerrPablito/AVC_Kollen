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

    isLoading = signal(true);
    hasError = signal(false);

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
        const dataValues = kommuner.map(k => parseFloat(k.stationsPer10k.toFixed(1)));

        const rawData = kommuner;

        this.chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Stationer per 10 000 invånare',
                    data: dataValues,
                    backgroundColor: 'rgba(226, 59, 78, 0.7)',
                    borderColor: '#e23b4e',
                    borderWidth: 1,
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
            indexAxis: 'y',
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
                            const index = context.dataIndex;
                            const dataset = context.dataset;
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
