import { Component, OnInit, DoCheck } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { TokenService } from '@service/token.service';
import { ToastService } from '@service/toast.service';
import { Toast } from '@class/toast';
import { ClipboardService } from 'ngx-clipboard';
import { NewGame } from '@class/new-game';
import { UsernameService } from '@service/username.service';
import { Router } from '@angular/router';

interface Pack {
  name: string;
  tag: string;
  black: number;
  white: number;
  selected: boolean;
  hidden: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.scss']
})
export class CreateGameComponent implements OnInit, DoCheck {

  baseUrl: string =  location.origin;

  query: string;
  black = 0;
  white = 0;
  packs: Pack[] = [];
  newGame = new NewGame(this._tokenService.get(), (Math.random() * 1E17).toString(36), 8, 20, 0, [], '', 5);

  username: string;
  joinGameURL: string;
  isGameCreated = false;
  isJoinGameURLCopied = false;

  constructor(
    private _socket: Socket,
    private _tokenService: TokenService,
    private _toastService: ToastService,
    private _clipboardService: ClipboardService,
    private _usernameService: UsernameService,
    private _router: Router
  ) {

    this._socket.removeListener('get-packs-list')
    this._socket.on('get-packs-list', (data: PackList) => {
      for (const d of data) {
        this.packs.push({
          name: d.pack,
          tag: '',
          black: d.black,
          white: d.white,
          selected: false,
          hidden: false
        });

        this.packs.forEach(p => {
          p.selected = p.name == "Cards Against Humanity" || p.name == "Cards Against Robots";
        });
      }
    });

  }

  ngOnInit() {
    if (this._usernameService.get()) {
      this.username = this._usernameService.get();
      this.joinGameURL = `${origin.toString()}/join/${this.newGame.gid}`;
      this._socket.emit('get-packs-list');
    } else {
      this._router.navigate(['/']);
    }
  }

  ngOnDestroy() {
    this._socket.removeListener('get-packs-list')
  }

  ngDoCheck() {

    this.black = 0;
    this.white = 0;

    for (const p of this.packs) {

      if (p.selected) {

        this.black += p.black;
        this.white += p.white;

      }

    }

  }

  filter() {

    const properties = ['name', 'tag'];

    for (const p of this.packs) {

      p.hidden = !properties.some(v => new RegExp(this.query, 'gi').test(p[v]));

    }

  }

  toggleAll(b: boolean) {

    for (const p of this.packs) {

      if (!p.hidden) {

        p.selected = b;

      }

    }

  }

  togglePack(pack: Pack) {

    for (const p of this.packs) {

      if (p.name === pack.name) {
        p.selected = !p.selected;
        break;
      }

    }

  }

  selectedPacks() {
    return this.packs.filter((pack: Pack) => {
      return pack.selected;
    });
  }

  startGame() {

    if (this.newGame.maxScore * this.newGame.maxPlayers >= this.black) {
      this._toastService.emit(new Toast(`Not enough black cards selected. ${this.newGame.maxScore * this.newGame.maxPlayers} required for this configuration.`));
      return;
    }

    this.newGame.packs = this.packs.filter(e => e.selected).map(e => e.name);

    this._socket.emit('new-game', this.newGame);

  }

  copyUrl() {
    this.isJoinGameURLCopied = true;

    const url = `${origin.toString()}/join/${this.newGame.gid}`;

    if (this._clipboardService.copyFromContent(url)) {
      const toast = new Toast('URL copied to clipboard.');
      this._toastService.emit(toast);
    } else {
      const toast = new Toast('Failed to copy URL to clipboard.');
      this._toastService.emit(toast);
    }

  }

}
