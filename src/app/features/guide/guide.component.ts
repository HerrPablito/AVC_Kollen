import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SopinfoService } from '../../core/services/sopinfo.service';
import { GuideArticle } from '../../core/models/sopinfo.models';
import { GuideArticleDetailComponent } from '../../shared/components/guide-article-detail.component';

@Component({
    selector: 'app-guide',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, DialogModule, ButtonModule],
    providers: [DialogService],
    templateUrl: './guide.component.html',
    styleUrl: './guide.component.scss'
})
export class SortingGuideComponent implements OnInit {
    private sopinfoService = inject(SopinfoService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private dialogService = inject(DialogService);

    articles = signal<GuideArticle[]>([]);
    isLoading = signal(true);
    searchQuery = signal('');

    ref: DynamicDialogRef | undefined | null;

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
    private failedImages = new Set<number>();

    constructor() { }

    ngOnInit() {
        this.loadArticles();

        this.route.queryParams.subscribe(params => {
            if (params['search']) {
                this.searchQuery.set(params['search']);
                this.loadArticles();
            }
        });
    }

    loadArticles() {
        this.isLoading.set(true);
        const query = this.searchQuery() || undefined;
        this.sopinfoService.getSortingGuide(query).subscribe({
            next: (data) => {
                this.articles.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.isLoading.set(false);
            }
        });
    }

    onSearch() {
        this.loadArticles();
    }

    selectArticle(article: GuideArticle) {
        this.sopinfoService.getGuideArticle(article.slug).subscribe(fullArticle => {
            this.showArticleDialog(fullArticle);
        });
    }

    private showArticleDialog(article: GuideArticle) {
        this.ref = this.dialogService.open(GuideArticleDetailComponent, {
            header: article.title,
            width: '100%',
            style: { 'max-width': '800px' },
            styleClass: 'dynamic-dialog-custom',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: false,
            resizable: false,
            showHeader: false,
            data: {
                article: article
            },
            modal: true
        });
    }

    getImageUrl(article: GuideArticle): string {
        if (this.fallbackMap[article.slug]) {
            return this.fallbackMap[article.slug];
        }
        if (article.image_url) {
            return `https://sopinfo.se/${article.image_url}`;
        }

        return this.defaultFallback;
    }

    handleImageError(article: GuideArticle) {
        this.failedImages.add(article.id);
    }
}
