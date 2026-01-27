import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { StationsComponent } from './features/stations/stations.component';
import { SortingGuideComponent } from './features/guide/guide.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { PrivacyComponent } from './features/privacy/privacy.component';
import { FaqComponent } from './features/faq/faq.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'stationer', component: StationsComponent },
    { path: 'sorteringsguide', component: SortingGuideComponent },
    { path: 'om', component: AboutComponent },
    { path: 'kontakt', component: ContactComponent },
    { path: 'integritetspolicy', component: PrivacyComponent },
    { path: 'faq', component: FaqComponent }
];

