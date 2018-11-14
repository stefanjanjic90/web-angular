import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

import { ModalDialogModule, SimpleModalComponent } from 'ngx-modal-dialog';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ToastModule } from 'ng2-toastr/ng2-toastr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgProgressModule } from 'ngx-progressbar';
import { TokenInterceptor } from './security/http-interceptor/token.interceptor';
import { UnauthorizedRequestInterceptor } from './security/http-interceptor/unauthorized-request.interceptor';
import { SecurityModule } from './security/security.module';
import { AppComponent } from './app.component';
import { NavigationComponent } from './view/navigation/navigation.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthModule } from './view/auth/auth.module';
import { ProjectModule } from './view/project/project.module';
import { WorklogModule } from '../app/view/worklog/worklog.module';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    SecurityModule,
    AppRoutingModule,
    AuthModule,
    NgbModule.forRoot(),
    ModalDialogModule.forRoot(),
    ToastModule.forRoot(),
    HttpClientModule,
    ProjectModule,
    WorklogModule,
    Ng2SmartTableModule,
    NgProgressModule
  ],
  entryComponents: [SimpleModalComponent],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnauthorizedRequestInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
