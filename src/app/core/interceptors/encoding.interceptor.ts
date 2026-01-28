import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * HTTP Interceptor to fix encoding issues from sopinfo.se API
 * 
 * Problem: The API returns UTF-8 data but without explicit charset in Content-Type header.
 * This causes Angular/browser to sometimes interpret it as ISO-8859-1/Latin-1, breaking Swedish characters (ÅÄÖ).
 * 
 * Solution: Intercept all responses from sopinfo.se and fix any incorrectly decoded text.
 */
export const encodingInterceptor: HttpInterceptorFn = (req, next) => {
    // Only apply to sopinfo.se API calls
    if (!req.url.includes('sopinfo.se')) {
        return next(req);
    }

    return next(req).pipe(
        map(event => {
            if (event instanceof HttpResponse && event.body) {
                // Recursively fix encoding in the response body
                const fixedBody = fixEncodingRecursive(event.body);
                return event.clone({ body: fixedBody });
            }
            return event;
        })
    );
};

/**
 * Recursively fixes encoding issues in objects, arrays, and strings
 */
function fixEncodingRecursive(data: any): any {
    if (typeof data === 'string') {
        return fixStringEncoding(data);
    }

    if (Array.isArray(data)) {
        return data.map(item => fixEncodingRecursive(item));
    }

    if (data && typeof data === 'object') {
        const fixed: any = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                fixed[key] = fixEncodingRecursive(data[key]);
            }
        }
        return fixed;
    }

    return data;
}

/**
 * Fixes a single string that was incorrectly decoded as Latin-1 instead of UTF-8
 * 
 * How it works:
 * 1. UTF-8 bytes for "ö" are: 0xC3 0xB6
 * 2. When incorrectly read as Latin-1, these become two characters: "Ã¶"
 * 3. We convert each character back to its byte value (Latin-1 encoding)
 * 4. Then decode those bytes as UTF-8 to get the correct character "ö"
 */
function fixStringEncoding(text: string): string {
    // Explicitly replace known double-encoded UTF-8 (interpreted as Latin-1/Win-1252) sequences.
    // This is more robust than generic decoding which can fail on mixed content.
    return text
        // Lowercase
        .replace(/Ã¥/g, 'å')  // å
        .replace(/Ã¤/g, 'ä')  // ä
        .replace(/Ã¶/g, 'ö')  // ö
        // Uppercase
        .replace(/Ã…/g, 'Å')  // Å
        .replace(/Ã„/g, 'Ä')  // Ä
        .replace(/Ã–/g, 'Ö')  // Ö
        // Other common chars
        .replace(/Ã©/g, 'é')  // é
        .replace(/Ã¨/g, 'è')  // è
        .replace(/Ã¼/g, 'ü')  // ü
        .replace(/Ã\*/g, '×') // ×
        // Punctuation
        .replace(/â€“/g, '–') // en-dash
        .replace(/â€™/g, '’') // right single quote
        .replace(/â€/g, '”'); // right double quote (partial match sometimes)
}
