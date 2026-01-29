import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class KonamiService implements OnDestroy {
    private sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    private currentStep = 0;
    private listener: ((e: KeyboardEvent) => void) | null = null;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            this.initListener();
        }
    }

    private initListener() {
        this.listener = (e: KeyboardEvent) => this.handleKey(e);
        window.addEventListener('keydown', this.listener);
    }

    ngOnDestroy() {
        if (this.listener) {
            window.removeEventListener('keydown', this.listener);
        }
    }

    private handleKey(event: KeyboardEvent) {
        // Only handle if no input is focused to avoid disrupting typing
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
            return;
        }

        if (event.key.toLowerCase() === this.sequence[this.currentStep].toLowerCase()) {
            this.currentStep++;
            if (this.currentStep === this.sequence.length) {
                this.activateEasterEgg();
                this.currentStep = 0;
            }
        } else {
            this.currentStep = 0;
            // Re-check if the pressed key is the start of the sequence
            if (event.key.toLowerCase() === this.sequence[0].toLowerCase()) {
                this.currentStep = 1;
            }
        }
    }

    private activateEasterEgg() {
        console.log('🚀 KONAMI CODE ACTIVATED! 🚀');
        this.showNotification();
        this.launchConfetti();
    }

    private showNotification() {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '20px';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.backgroundColor = '#e23b4e';
        div.style.color = 'white';
        div.style.padding = '1rem 2rem';
        div.style.borderRadius = '50px';
        div.style.fontWeight = 'bold';
        div.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        div.style.zIndex = '999999';
        div.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
        div.innerHTML = '✨ Super Recycler Mode Activated! ✨';

        // Add animation styles
        const style = document.createElement('style');
        style.innerHTML = `
      @keyframes popIn {
        from { transform: translateX(-50%) scale(0.5); opacity: 0; }
        to { transform: translateX(-50%) scale(1); opacity: 1; }
      }
      @keyframes fadeOut {
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
        document.head.appendChild(style);
        document.body.appendChild(div);

        setTimeout(() => {
            div.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => {
                div.remove();
                style.remove();
            }, 500);
        }, 3000);
    }

    private launchConfetti() {
        // Simple confetti implementation
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999998';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const particleCount = 150;
        const colors = ['#e23b4e', '#ff8aa3', '#ffffff', '#2a0016'];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                rotation: Math.random() * 360,
                speedX: Math.random() * 4 - 2,
                speedY: Math.random() * 4 + 2,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotationSpeed: Math.random() * 4 - 2
            });
        }

        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let activeParticles = 0;

            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();

                if (p.y < canvas.height + 20) {
                    activeParticles++;
                }
            });

            if (activeParticles > 0) {
                animationId = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animationId);
                canvas.remove();
            }
        };

        animate();
    }
}
