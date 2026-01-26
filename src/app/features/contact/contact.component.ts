import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '../../core/services/contact.service';

import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        Card,
        InputText,
        Textarea,
        Button,
        Message,
    ],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.scss'
})
export class ContactComponent {
    loading = signal(false);
    success = signal(false);
    error = signal<string | null>(null);

    form;

    constructor(
        private fb: FormBuilder,
        private contactService: ContactService
    ) {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            message: ['', [Validators.required, Validators.minLength(10)]],
        });
    }

    showError(controlName: 'email' | 'message') {
        const c = this.form.get(controlName);
        return !!c && c.invalid && (c.dirty || c.touched);
    }

    submit() {
        this.success.set(false);
        this.error.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);

        this.contactService.sendContactMessage(this.form.value as any).subscribe({
            next: (res) => {
                if (res?.ok) {
                    this.success.set(true);
                    this.form.reset({ email: '', phone: '', message: '' });
                } else {
                    this.error.set(res?.error ?? 'Något gick fel.');
                }
                this.loading.set(false);
            },
            error: () => {
                this.error.set('Kunde inte skicka just nu. Försök igen senare.');
                this.loading.set(false);
            }
        });
    }
}
