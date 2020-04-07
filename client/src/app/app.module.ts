import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContenteditableModule } from '@ng-stack/contenteditable';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Components
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { CreateGameComponent } from './create-game/create-game.component';
import { GameComponent } from './game/game.component';
import { InGameSettingsComponent } from './in-game-settings/in-game-settings.component';
import { SettingsComponent } from './settings/settings.component';
import { ToastComponent } from './toast/toast.component';

// Services
import { SocketService } from '@service/socket.service';
import { UsernameService } from '@service/username.service';
import { TokenService } from '@service/token.service';
import { ToastService } from '@service/toast.service';

// Modules
import { ClipboardModule } from 'ngx-clipboard';
import { FAModule } from './fa/fa.module';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Other imports
import { SocketIoModule } from 'ngx-socket-io';
import { environment as env } from '../environments/environment';
import { InfoComponent } from './info/info.component';
import { BlankCardModalComponent } from './blank-card-modal/blank-card-modal.component';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ContenteditableModule,
    SocketIoModule.forRoot(env.sioc),
    ClipboardModule,
    FAModule,
    PickerModule,
    ScrollToModule.forRoot(),
    DragDropModule
  ],
  declarations: [
    AppComponent,
    MainComponent,
    CreateGameComponent,
    GameComponent,
    InGameSettingsComponent,
    SettingsComponent,
    ToastComponent,
    InfoComponent,
    BlankCardModalComponent
  ],
  providers: [
    SocketService,
    UsernameService,
    TokenService,
    ToastService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
