import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { StationsComponent } from './features/stations/stations.component';
import { SortingGuideComponent } from './features/guide/guide.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'stationer', component: StationsComponent },
    { path: 'sorteringsguide', component: SortingGuideComponent }
];
