import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    LoginComponent,
    LogoutComponent
  ],
  declarations: [
    LoginComponent,
    LogoutComponent
  ]
})
export class AuthModule { }
