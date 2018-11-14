import { Component, OnInit } from '@angular/core';
import { StorageKey } from '../../../../configuration/storage-key';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html'
})
export class LogoutComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    localStorage.removeItem(StorageKey.authorizationTokens);
    window.location.href = environment.logoutUrl;
  }
}
