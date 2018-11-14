import { NgModule } from '@angular/core';
import { AuthGuardService } from './auth-guard.service';

@NgModule({
  providers: [
    AuthGuardService
  ]
})
export class SecurityModule { }
