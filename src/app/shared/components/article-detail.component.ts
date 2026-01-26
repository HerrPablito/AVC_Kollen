import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GuideArticle } from '../../core/models/sopinfo.models';

@Component({
    selector: 'app-article-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './article-detail.component.html',
    styleUrl: './article-detail.component.scss'
})
export class ArticleDetailComponent {
    @Input() article!: GuideArticle;
    @Input() showFooter = true;
    @Output() close = new EventEmitter<void>();

    onClose() {
        this.close.emit();
    }
}
