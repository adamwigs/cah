import { GameRequest } from './game-request';

export class ReconnectGame implements GameRequest {
    constructor(
        public pid: string,
        public gid: string,
        public username: string,
        public emoji: string
    ) { }
}