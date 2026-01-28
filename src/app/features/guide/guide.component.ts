import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SopinfoService } from '../../core/services/sopinfo.service';
import { GuideArticle } from '../../core/models/sopinfo.models';

@Component({
    selector: 'app-guide',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, DialogModule, ButtonModule],
    templateUrl: './guide.component.html',
    styleUrl: './guide.component.scss'
})
export class SortingGuideComponent implements OnInit {
    articles = signal<GuideArticle[]>([]);
    isLoading = signal(true);
    searchQuery = signal('');
    selectedArticle = signal<GuideArticle | null>(null);

    // Map of slugs to local fallback images
    // We now prioritize these local images over the API ones as per user request
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
        'flyttguiden': 'assets/images/categories/aterbruksguiden.png', // Reusing reuse image
        'aterbruksguiden': 'assets/images/categories/aterbruksguiden.png',
        'renoveringsguiden': 'assets/images/categories/byggavfall.png', // Reusing construction image
        'tra_och_mobler': 'assets/images/categories/tra-och-mobler.png',
        'textilier': 'assets/images/categories/textil.png',
        'sorteringshjalpen': 'assets/images/categories/aterbruksguiden.png', // Reusing reuse image
        'batterier': 'assets/images/categories/batterier.png',
        'elektronik': 'assets/images/categories/elektronik.png'
    };
    private defaultFallback = 'assets/images/categories/fallback.png';
    // set of article IDs that have failed to load their remote image
    private failedImages = new Set<number>();

    constructor(
        private sopinfoService: SopinfoService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadArticles();

        // Handle query params for direct search/linking
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
        this.selectedArticle.set(article);
        this.sopinfoService.getGuideArticle(article.slug).subscribe(fullArticle => {
            // Persist the image fallback state if the list item failed
            if (this.failedImages.has(article.id)) {
                this.failedImages.add(fullArticle.id);
            }
            this.selectedArticle.set(fullArticle);
        });
    }

    clearSelection() {
        this.selectedArticle.set(null);
    }

    getImageUrl(article: GuideArticle): string {
        // Option 1: Prioritize local "fallback" images if they exist
        if (this.fallbackMap[article.slug]) {
            return this.fallbackMap[article.slug];
        }

        // Option 2: Use API image if available
        if (article.image_url) {
            return `https://sopinfo.se/${article.image_url}`;
        }

        // Option 3: Default fallback
        return this.defaultFallback;
    }

    handleImageError(article: GuideArticle) {
        this.failedImages.add(article.id);
    }
}
