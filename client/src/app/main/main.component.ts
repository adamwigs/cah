import { Component, OnInit } from '@angular/core';
import { UsernameService } from '@service/username.service';
import { ActivatedRoute } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { TokenService } from '@service/token.service';
import { JoinGame } from '@class/join-game';
import { EmojiEvent } from '@ctrl/ngx-emoji-mart/ngx-emoji/public_api';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  username: string;
  currentEmoji: string;

  isEmojiPickerVisible = false;
  isInActionSelectionMode = false;

  joinGame = new JoinGame(this._token.get(), '', '');
  pathIsJoin = false;

  constructor(
    private _route: ActivatedRoute,
    private _socket: Socket,
    private _token: TokenService,
    private _usernameService: UsernameService
    ) { }

  ngOnInit() {

    this.username = this._usernameService.get();
    this.currentEmoji = this._usernameService.getEmoji();

    if (this._route.routeConfig && this._route.routeConfig.path === 'join/:id') {
      this.pathIsJoin = true;
      this._route.params.forEach(v => {
        this.joinGame.gid = v.id;
      });
    }

  }

  toggleEmojiPicker() {
    if (this.isEmojiPickerVisible) {
      this.isEmojiPickerVisible = false;
    } else{
      this.isEmojiPickerVisible = true;
    }
  }

  setEmoji($event: EmojiEvent) {
    this.currentEmoji = $event.emoji.native;
    this.isEmojiPickerVisible = false;
    this._usernameService.setEmoji(this.currentEmoji);
  }

  setUsername() {

    this._usernameService.set(this.username);

  }

  getStarted() {
    this.isInActionSelectionMode = true;
    this.isEmojiPickerVisible = false;

    // var scrollToService = this._scrollToService;

    // setTimeout(function() {
    //   const config: ScrollToConfigOptions = {
    //     target: 'cards',
    //     duration: 500,
    //     easing: 'easeInOutCubic',
    //     offset: 20
    //   };
    
    //   scrollToService.scrollTo(config);
    // }, 100);
  }

  join() {

    this._socket.emit('join-game', this.joinGame);
    
  }

}
