import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactFormData {
    email: string;
    phone?: string;
    message: string;
}

export interface ContactResponse {
    ok: boolean;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ContactService {

    constructor(private http: HttpClient) { }

    sendContactMessage(data: ContactFormData): Observable<ContactResponse> {
        return this.http.post<ContactResponse>('/api/contact', data);
    }
}
