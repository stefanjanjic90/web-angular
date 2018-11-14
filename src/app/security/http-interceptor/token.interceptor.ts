import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { StorageKey } from '../../../configuration/storage-key';
import { AuthorizationHeader } from '../../../configuration/authorization-header';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

    constructor() { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const tokensString = localStorage.getItem(StorageKey.authorizationTokens);
        if (tokensString) {
            const tokens = JSON.parse(tokensString);

            const headers = {};
            headers[AuthorizationHeader.Azure] = tokens.azure;
            const authorizedRequest = request.clone({
                setHeaders: headers
            });

            return next.handle(authorizedRequest);
        }
        return next.handle(request);
    }
}
