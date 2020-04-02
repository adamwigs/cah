import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { EasterEggService } from './easter-egg.service';

@Injectable({
  providedIn: 'root'
})
export class UsernameService {

  username = '';

  constructor(
    private _socketService: SocketService,
    private _eggService: EasterEggService
  ) { }

  set(username: string) {

    sessionStorage.setItem('username', username);
    this._socketService.setUserIdentity(username, this.getEmoji());

    // Easter eggs
    if (username.toLowerCase() === 'comic sans') {
      this._eggService.enable('comicSans');
    } else if (username.toLowerCase() === 'rainbow') {
      this._eggService.enable('rainbow');
    } else {
      this._eggService.disable('comicSans');
      this._eggService.disable('rainbow');
    }

  }

  get() {

    return sessionStorage.getItem('username') || '';

  }

  setEmoji(emoji: string) {
    sessionStorage.setItem('emoji', emoji);
    this._socketService.setUserIdentity(this.get(), emoji);
  }

  getEmoji() {
    return sessionStorage.getItem('emoji') || '🤪';
  }

}
