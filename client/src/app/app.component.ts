import { Component, OnInit, DoCheck } from '@angular/core';
import { SocketService } from '@service/socket.service';
import { UsernameService } from '@service/username.service';
import { SettingsService } from '@service/settings.service';
import { Socket } from 'ngx-socket-io';
import { Toast } from '@class/toast';
import { Router } from '@angular/router';
import { ToastService } from '@service/toast.service';

interface SocketError {
  message: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, DoCheck {

  acronym = 'Chickens Attack Helicopters';
  username = '';
  toast = new Toast('');
  showSettings = false;
  tilted = false;

  constructor(
    private _socketService: SocketService,
    private _usernameService: UsernameService,
    private _settingsService: SettingsService,
    private _socket: Socket,
    private _router: Router,
    private _toastService: ToastService
    ) {

    this._socketService.auth();
    this._usernameService.set(this._usernameService.get());
    this.username = this._usernameService.get();

    if (this._settingsService.settings.acronyms.get()) {

      this._socket.on('acronym', (acronym: string) => {
        this.acronym = acronym;

        this.tilted = this._settingsService.settings.eggs.get() && acronym === 'CSS Against HTML';

      });

      this._socket.emit('acronym');

    }

    this._toastService.event().subscribe((data: Toast) => {
      this.toast = data;
      this.toast.show();
    });

    this._socket.on('error-message', (data: SocketError) => {
      this.toast.setMsg(data.message);
      this.toast.show();
    });

    this._socket.on('reconnect', () => {
      this.toast.setMsg('Reconnected to game server.');
      this.toast.show();
    });

    this._socket.on('reconnect_failed', () => {
      this.toast.setMsg('Failed to reconnect to game server.');
      this.toast.show();
    });

    this._socket.on('redirect', (data: string[]) => {
      this._router.navigate(data);
    });

  }

  ngOnInit() {
  }

  ngDoCheck() {
    this.username = this._usernameService.get();
  }

}
