import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavigationComponent } from './view/navigation/navigation.component';
import { AuthGuardService } from './security/auth-guard.service';
import { LoginComponent } from './view/auth/login/login.component';
import { LogoutComponent } from './view/auth/logout/logout.component';

const appRoutes: Routes = [
  {
    path: '',
    component: NavigationComponent,
    canActivate: [AuthGuardService],
    canActivateChild: [AuthGuardService],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'project'
      },
      {
        path: 'project',
        loadChildren: './view/project/project.module#ProjectModule',
        data: { preload: true }
      },
      {
        path: 'worklog',
        loadChildren: './view/worklog/worklog.module#WorklogModule',
      }
    ]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'logout',
    component: LogoutComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
