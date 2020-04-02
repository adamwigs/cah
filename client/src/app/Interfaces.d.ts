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
    winner?: true;
    cards: WhiteCard[];
}

type PackList = [{
    pack: string;
    black: number;
    white: number;
}]

declare namespace ISocket {

    interface Error {
        message: string;
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
