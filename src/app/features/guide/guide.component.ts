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
    private fallbackMap: { [key: string]: string } = {
        'tidningar-och-papper': 'assets/images/categories/tidningar-och-papper.png',
        'tradgardsavfall': 'assets/images/categories/tradgardsavfall.png',
        'byggavfall': 'assets/images/categories/byggavfall.png',
        'aterbruksguiden': 'assets/images/categories/aterbruksguiden.png',
        'batterier': 'assets/images/categories/batterier.png',
        'renoveringsguiden': 'assets/images/categories/byggavfall.png',
        'sorteringshjalpen': 'assets/images/categories/aterbruksguiden.png'
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
        // If we know this image failed, return local fallback
        if (this.failedImages.has(article.id)) {
            return this.fallbackMap[article.slug] || this.defaultFallback;
        }

        // If API has no URL, return local fallback immediately
        if (!article.image_url) {
            return this.fallbackMap[article.slug] || this.defaultFallback;
        }

        // Otherwise try the remote URL
        return `https://sopinfo.se/${article.image_url}`;
    }

    handleImageError(article: GuideArticle) {
        this.failedImages.add(article.id);
    }
}
