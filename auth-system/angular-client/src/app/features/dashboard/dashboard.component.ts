import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    user = signal<User | null>(null);
    loading = signal(true);
    errorMessage = signal<string | null>(null);

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadUser();
    }

    loadUser(): void {
        this.loading.set(true);
        this.errorMessage.set(null);

        this.authService.me().subscribe({
            next: (user) => {
                this.user.set(user);
                this.loading.set(false);
            },
            error: (error) => {
                this.loading.set(false);
                this.errorMessage.set('Failed to load user information');
                console.error('Load user error:', error);
            }
        });
    }

    logout(): void {
        this.authService.logout().subscribe({
            next: () => {
                this.router.navigate(['/login']);
            },
            error: (error) => {
                console.error('Logout error:', error);
                // Navigate to login anyway
                this.router.navigate(['/login']);
            }
        });
    }
}
