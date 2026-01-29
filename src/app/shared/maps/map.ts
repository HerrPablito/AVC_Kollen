import { Component, ElementRef, OnDestroy, OnInit, ViewChild, PLATFORM_ID, Inject, Input, OnChanges, SimpleChanges, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { isPlatformBrowser } from '@angular/common';
import StadiaMaps from 'ol/source/StadiaMaps.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Circle, Fill, Stroke, Icon } from 'ol/style';
import { Station } from '../../core/models/sopinfo.models';
import Overlay from 'ol/Overlay';

@Component({
    selector: 'app-map',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './map.html',
    styleUrl: './map.scss'
})
export class MapComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild('mapElement', { static: true }) mapElement: ElementRef | undefined;
    @ViewChild('popupContainer', { static: true }) popupContainer: ElementRef | undefined;

    @Input() stations: Station[] = [];
    @Input() center: [number, number] = [20.26, 63.82]; // Default Umeå approx
    @Input() zoom = 11;

    map: Map | undefined;
    private markerLayer: VectorLayer<VectorSource> | undefined;
    private overlay: Overlay | undefined;

    selectedStation: Station | null = null;

    // Fixed dark theme for consistency
    choosenLayer = 'alidade_smooth_dark';
    private currentLayer!: TileLayer<StadiaMaps>;

    ngOnInit(): void {

    }

    ngOnDestroy(): void {
        this.map?.setTarget(undefined);
    }

    ngAfterViewInit(): void {
        this.initMap();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['stations'] && this.map) {
            this.updateMarkers();
        }
        if (changes['center'] && this.map) {
            this.map.getView().setCenter(fromLonLat(this.center));
        }
        if (changes['zoom'] && this.map) {
            this.map.getView().setZoom(this.zoom);
        }
    }

    constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone, private cdRef: ChangeDetectorRef) { }

    private initMap(): void {
        if (isPlatformBrowser(this.platformId)) {
            // Base Layer
            this.currentLayer = new TileLayer({
                source: new StadiaMaps({
                    layer: this.choosenLayer,
                }),
            });

            // Marker Layer
            this.markerLayer = new VectorLayer({
                source: new VectorSource(),
                style: new Style({
                    image: new Circle({
                        radius: 8,
                        fill: new Fill({ color: '#e23b4e' }),
                        stroke: new Stroke({ color: 'white', width: 2 })
                    })
                })
            });

            // Popup Overlay
            this.overlay = new Overlay({
                element: this.popupContainer?.nativeElement,
                autoPan: {
                    animation: {
                        duration: 250,
                    },
                },
                positioning: 'bottom-center',
                offset: [0, -10],
                stopEvent: false
            });

            this.map = new Map({
                target: this.mapElement?.nativeElement,
                layers: [
                    this.currentLayer,
                    this.markerLayer
                ],
                overlays: [this.overlay],
                view: new View({
                    center: fromLonLat(this.center),
                    zoom: this.zoom
                })
            });

            // If stations are already provided
            if (this.stations.length > 0) {
                this.updateMarkers();
            }

            this.map.on('singleclick', this.handleMapClick.bind(this));
        }
    }

    private updateMarkers() {
        if (!this.markerLayer || !this.stations) return;

        const source = this.markerLayer.getSource();
        source?.clear();

        const features = this.stations
            .filter(s => s.latitude && s.longitude)
            .map(s => {
                const feature = new Feature({
                    geometry: new Point(fromLonLat([s.longitude, s.latitude])),
                    name: s.name,
                    station: s
                });
                return feature;
            });

        source?.addFeatures(features);
    }

    private handleMapClick(event: any): void {
        const feature = this.map?.forEachFeatureAtPixel(event.pixel, (feature) => feature, {
            hitTolerance: 10
        });

        this.ngZone.run(() => {
            if (feature) {
                const station = feature.get('station');

                if (station) {
                    this.selectedStation = station;

                    // Manually trigger detection to ensure popup content renders
                    this.cdRef.detectChanges();

                    const geometry = feature.getGeometry();
                    if (geometry instanceof Point) {
                        const coordinates = geometry.getCoordinates();
                        this.overlay?.setPosition(coordinates);
                    }
                    return;
                }
            }
            // If no feature clicked, close popup
            this.closePopup();
        });
    }

    closePopup() {
        this.selectedStation = null;
        this.overlay?.setPosition(undefined);
    }
}