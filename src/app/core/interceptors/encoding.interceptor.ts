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
    try {
        // Check if the string contains mojibake patterns (common UTF-8 as Latin-1 errors)
        // These patterns indicate the string needs fixing
        const hasMojibake = /[Ã][¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/.test(text);

        if (!hasMojibake) {
            // String looks fine, no need to fix
            return text;
        }

        // Convert string to Latin-1 bytes, then decode as UTF-8
        const latin1Bytes: number[] = [];
        for (let i = 0; i < text.length; i++) {
            latin1Bytes.push(text.charCodeAt(i) & 0xFF);
        }

        const utf8String = new TextDecoder('utf-8').decode(new Uint8Array(latin1Bytes));

        // Verify the fix didn't make things worse
        // If the result has replacement characters, return original
        if (utf8String.includes('�')) {
            return text;
        }

        return utf8String;
    } catch (error) {
        // If anything goes wrong, return original text
        console.warn('Encoding fix failed for string:', text, error);
        return text;
    }
}
