import { Injectable } from '@angular/core';
import {
  CanActivate, Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateChild
} from '@angular/router';
import { StorageKey } from '../../configuration/storage-key';


@Injectable()
export class AuthGuardService implements CanActivate, CanActivateChild {

  constructor(
    private router: Router,
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.isAuthenticated(route, state);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  isAuthenticated(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isAuthenticated = !!localStorage.getItem(StorageKey.authorizationTokens);
    if (!isAuthenticated) {
      if (!route.queryParams.tokens) {
        this.router.navigate(['/login']);
      } else {
        localStorage.setItem(StorageKey.authorizationTokens, route.queryParams.tokens);
        this.router.navigate(['']);
      }
    }
    return isAuthenticated;
  }
}
