import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GuideArticle } from '../../core/models/sopinfo.models';

@Component({
    selector: 'app-guide-article-detail',
    standalone: true,
    imports: [CommonModule, ButtonModule, RouterLink],
    templateUrl: './guide-article-detail.component.html',
    styleUrl: './guide-article-detail.component.scss'
})
export class GuideArticleDetailComponent {
    private config = inject(DynamicDialogConfig);
    public ref = inject(DynamicDialogRef);

    article: GuideArticle = this.config.data.article;

    // Map of slugs to local fallback images
    private fallbackMap: { [key: string]: string } = {
        'plastforpackningar': 'assets/images/categories/plastforpackningar.png',
        'matavfall': 'assets/images/categories/matavfall.png',
        'pappersforpackningar': 'assets/images/categories/pappersforpackningar.png',
        'metallforpackningar': 'assets/images/categories/metallforpackningar.png',
        'tidningar-och-papper': 'assets/images/categories/tidningar-och-papper.png',
        'farligt-avfall': 'assets/images/categories/farligt-avfall.png',
        'glasforpackningar': 'assets/images/categories/glasforpackningar.png',
        'grovavfall': 'assets/images/categories/grovavfall.png',
        'tradgardsavfall': 'assets/images/categories/tradgardsavfall.png',
        'restavfall': 'assets/images/categories/restavfall.png',
        'pant': 'assets/images/categories/pant.png',
        'byggavfall': 'assets/images/categories/byggavfall.png',
        'flyttguiden': 'assets/images/categories/aterbruksguiden.png',
        'aterbruksguiden': 'assets/images/categories/aterbruksguiden.png',
        'renoveringsguiden': 'assets/images/categories/byggavfall.png',
        'tra_och_mobler': 'assets/images/categories/tra-och-mobler.png',
        'textilier': 'assets/images/categories/textil.png',
        'sorteringshjalpen': 'assets/images/categories/aterbruksguiden.png',
        'batterier': 'assets/images/categories/batterier.png',
        'elektronik': 'assets/images/categories/elektronik.png'
    };
    private defaultFallback = 'assets/images/categories/fallback.png';

    getImageUrl(article: GuideArticle): string {
        if (this.fallbackMap[article.slug]) {
            return this.fallbackMap[article.slug];
        }
        if (article.image_url) {
            return `https://sopinfo.se/${article.image_url}`;
        }
        return this.defaultFallback;
    }

    close() {
        this.ref.close();
    }
}
