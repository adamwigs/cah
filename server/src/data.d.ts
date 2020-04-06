interface WhiteCard {
    id: number;
    text: string;
    pack: string;
}

interface BlackCard extends WhiteCard {
    pick: number;
    draw: number;
}

interface PlayedCards {
    pid: string;
    cards: WhiteCard[];
}

interface Pack {
    pack: string;
    black: number;
    white: number;
}

interface InfoResponse {
    players: number;
    games: number;
    version: string;
}

declare namespace Socket {

    interface Error {
        message: string;
    }

    interface Request {
        pid: string;
    }

    interface UsernameUpdate extends Request {
        username: string;
        emoji: string;
    }

    interface GameRequest extends Request {
        gid: string;
    }

    interface NewGame extends GameRequest {
        maxScore: number;
        maxPlayers: number;
        timeout: number;
        packs: string[];
        password: string;
        blanks: number;
    }

    interface RestartGame extends GameRequest {
        hid: string;
    }

    interface ReconnectGame extends GameRequest {
        pid: string,
        gid: string,
        username: string,
        emoji: string
    }

    interface JoinGameRequest extends GameRequest {
        password: string;
    }

    interface CustomWhite extends GameRequest {
        text: string;
    }

    interface PickWhite extends GameRequest {
        card: WhiteCard
    }

    interface PickWinner extends GameRequest {
        winner: string;
    }

    namespace GameState {

        interface Player {
            username: string;
            emoji: string;
            id: string;
            done: boolean;
            host: boolean;
            score: number;
        }

        interface State {
            created: number;
            hid: string; // Host ID
            gid: string; // Game ID
            czar: string;
            hand: WhiteCard[];
            picks: WhiteCard[];
            black: BlackCard;
            playedCards: PlayedCards[];
            players: Player[];
            blanksRemaining: number;
            round: number;
            settings: {
                maxScore: number;
                maxPlayers: number;
                timeout: number;
                packs: string[];
                password: string;
                blanks: number;
            }
        }

    }

}
