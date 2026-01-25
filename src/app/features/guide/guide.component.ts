import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SopinfoService } from '../../core/services/sopinfo.service';
import { GuideArticle } from '../../core/models/sopinfo.models';

@Component({
    selector: 'app-guide',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './guide.component.html',
    styleUrl: './guide.component.scss'
})
export class SortingGuideComponent implements OnInit {
    articles = signal<GuideArticle[]>([]);
    isLoading = signal(true);
    searchQuery = signal('');

    // If slug exists, we are in detail view (or we could use child routes, but simple toggle for now)
    selectedArticle = signal<GuideArticle | null>(null);

    constructor(
        private sopinfoService: SopinfoService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        // Check if we have a search query param or article slug? 
        // Plan said: /api/sorteringsguide?search or /api/sorteringsguide/:slug.
        // Our route is just 'sorteringsguide'. Maybe we should have 'sorteringsguide/:slug' too?
        // Let's implement list view first, and modal/detail handling.

        this.loadArticles();
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
        // Optionally update URL to reflect selection?
        // this.router.navigate([], { queryParams: { article: article.slug } });
        this.sopinfoService.getGuideArticle(article.slug).subscribe(fullArticle => {
            this.selectedArticle.set(fullArticle);
        });
    }

    clearSelection() {
        this.selectedArticle.set(null);
    }
}
