import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpErrorResponse,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { StorageKey } from '../../../configuration/storage-key';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import * as HttpStatusCodes from 'http-status-codes';

@Injectable()
export class UnauthorizedRequestInterceptor implements HttpInterceptor {

    constructor(
        private router: Router) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).do(
            (event: HttpEvent<any>) => { },
            (error: any) => {
                if (error instanceof HttpErrorResponse && error.status === HttpStatusCodes.UNAUTHORIZED) {
                    localStorage.removeItem(StorageKey.authorizationTokens);
                    this.router.navigate(['/login']);
                }
            });
    }
}
