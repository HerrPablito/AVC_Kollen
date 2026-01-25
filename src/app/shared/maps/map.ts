import { Component, ElementRef, OnDestroy, OnInit, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { isPlatformBrowser } from '@angular/common';
import StadiaMaps from 'ol/source/StadiaMaps.js';


@Component({
    selector: 'app-map',
    standalone: true,
    imports: [],
    templateUrl: './map.html',
    styleUrl: './map.scss'
})
export class MapComponent implements OnInit, OnDestroy {
    @ViewChild('mapElement', { static: true }) mapElement: ElementRef | undefined;
    map: Map | undefined;

    onClickTerrain() {
        this.choosenLayer = 'stamen_terrain_labels';
        this.updateLayer();
    }

    onClickDark() {
        this.choosenLayer = 'alidade_smooth_dark';
        this.updateLayer();
    }

    onClickToner() {
        this.choosenLayer = 'stamen_toner';
        this.updateLayer();
    }

    onClickOutdoors() {
        this.choosenLayer = 'outdoors';
        this.updateLayer();
    }

    onClickWatercolor() {
        this.choosenLayer = 'stamen_watercolor';
        this.updateLayer();
    }

    choosenLayer = 'stamen_watercolor' as string;
    private currentLayer!: TileLayer<StadiaMaps>;

    private updateLayer(): void {
        if (!this.map || !this.currentLayer) {
            console.error('Map or current layer is not defined!');
            return;
        }

        this.map.removeLayer(this.currentLayer);

        this.currentLayer = new TileLayer<StadiaMaps>({
            source: new StadiaMaps({
                layer: this.choosenLayer,
            }),
        });

        this.map.addLayer(this.currentLayer);
    }

    ngOnInit(): void {

    }

    ngOnDestroy(): void {
        this.map?.setTarget(undefined);
    }

    ngAfterViewInit(): void {
        this.initMap();
    }
    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    private initMap(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.currentLayer = new TileLayer({
                source: new StadiaMaps({
                    layer: this.choosenLayer,
                }),
            });

            this.map = new Map({
                target: this.mapElement?.nativeElement,
                layers: [
                    new TileLayer({
                        source: new OSM()
                    }),
                    this.currentLayer,
                ],
                view: new View({
                    center: fromLonLat([20.242829157757257, 63.82811461193097]),
                    zoom: 11
                })
            });
            this.map.on('singleclick', this.handleMapClick.bind(this));
        }
    }


    private handleMapClick(event: any): void {
        console.log(`Zoom level: ${this.map?.getView().getZoom()}`);
        console.log(`Map coordinates (wgs84): ${toLonLat(event.coordinate)}`);
        console.log(`Pixel coordinates (top-left): ${event.pixel}`);
    }
}