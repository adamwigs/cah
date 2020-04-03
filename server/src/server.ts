import express from 'express';
import socketio from 'socket.io';
import { env } from 'process';
import { Game, Games } from './game';
import { Player, Players } from './player';
import { Client } from 'pg';
import { dbConf } from './config';
import * as path from 'path';
import * as log from 'solid-log';
import { getStack, getStats, IInfo, Stats, Stack } from './utils';

// Configure logging
log.add(new log.ConsoleLogger(env.NODE_ENV === 'dev' ? log.LogLevel.debug : log.LogLevel.warn));
log.add(new log.FileLogger(env.NODE_ENV === 'dev' ? log.LogLevel.debug : log.LogLevel.warn));

const port = env.NODE_PORT ? Number(env.NODE_PORT) : 5000;
const app = express();

const server = app.listen(port, () => {
    log.info(`Server listening on port ${port}`);
});

const io = socketio(server, {
    origins: env.NODE_ENV === 'production' ? ['cah.ninja:443'] : ['*:*']
});

const games: Games = {};
const players: Players = {};

io.on('connection', socket => {

    // console.log(`New socket: ${socket.id}`);

    socket.on('login', (id: string) => {

        if (players[id]) {
            players[id].socket = socket;
            // console.log(`Updating socket for player ${id}.`);
        } else {
            players[String(id)] = new Player(id, socket);
            // console.log(`Player ${id} joined the game.`);
        }

    });

    socket.on('username', (data: Socket.UsernameUpdate) => {

        const { pid, username, emoji } = data;
        if (players[pid]) {
            players[pid].username = username;
            players[pid].emoji = emoji;
        }
        // console.log(`Player ${pid} changed username to ${username ? username : '<none>'}.`);

    });

    socket.on('get-packs-list', async () => {

        const packs: Pack[] = [];

        try {

            const db = new Client(dbConf);
            await db.connect();
            const queryRes = await db.query('select distinct pack from white union select pack from black');

            for (const p of queryRes.rows) {

                const b = await db.query('select count(*) from black where pack=$1', [p.pack]);
                const c = await db.query('select count(*) from white where pack=$1', [p.pack]);

                packs.push({
                    pack: p.pack,
                    black: Number(b.rows[0].count),
                    white: Number(c.rows[0].count)
                });

            }

            db.end();

        } catch (e) {

            log.error(e instanceof Error ? e.stack : e);

            socket.emit('error-message', {
                message: 'Error getting cards from database.'
            });


        }

        socket.emit('get-packs-list', packs.sort((a, b) => (a.pack > b.pack) ? 1 : ((b.pack > a.pack) ? -1 : 0)));

    });

    socket.on('acronym', async () => {

        try {

            const db = new Client(dbConf);
            await db.connect();
            const dbres = await db.query('select text from acronyms offset floor(random() * (select count(*) from acronyms)) limit 1');
            db.end();

            socket.emit('acronym', dbres.rows[0].text);

        } catch (e) {

            log.error(e instanceof Error ? e.stack : e);

        }

    });

    socket.on('new-game', (data: Socket.NewGame) => {
        if (!data.pid) {
            socket.emit('error-message', {
                message: 'No player found to create game.'
            });
            return;
        }

        if (!data.gid) {
            socket.emit('error-message', {
                message: 'No game identifier found.'
            });
            return;
        }

        if (!players[data.pid]) {
            socket.emit('error-message', {
                message: 'Player is not known in global list of players.'
            });
            return;
        }

        if (players[data.pid].inGame) {
            socket.emit('error-message', {
                message: 'Player is already joined in another game.'
            });
            return;
        }

        if (data.pid && data.gid && players[data.pid] && !players[data.pid].inGame) {
            games[data.gid] = new Game(
                data.gid,
                players[data.pid],
                data.packs,
                data.password,
                data.maxScore,
                data.maxPlayers,
                data.timeout,
                data.blanks
            );
        } else {
            socket.emit('error-message', {
                message: 'Error creating game.'
            });
        }
    });

    socket.on('join-game', (data: Socket.JoinGameRequest) => {
        if (!games[data.gid]) {
            socket.emit('error-message', {
                message: 'Game with identifier not found.'
            });
            return;
        }

        if (!players[data.pid]) {
            socket.emit('error-message', {
                message: 'Player not found to join game.'
            });
            return;
        }

        if (players[data.pid].inGame) {
            socket.emit('error-message', {
                message: 'Player is already joined in this game.'
            });
            return;
        }

        if (games[data.gid].players.amount() >= games[data.gid].maxPlayers) {
            socket.emit('error-message', {
                message: 'Game is already at the max players.'
            });
            return;
        }

        if (games[data.gid] && players[data.pid] && !players[data.pid].inGame && games[data.gid].players.amount() < games[data.gid].maxPlayers) {
            if (games[data.gid].password.check(data.password) && players[data.pid].username) {
                games[data.gid].players.add(players[data.pid]);
                socket.emit('redirect', ['game', data.gid]);
            } else if (!players[data.pid].username) {
                socket.emit('error-message', {
                    message: 'You may not enter a game without a username.'
                });
            } else {
                socket.emit('error-message', {
                    message: 'Incorrect password.'
                });
            }
        } else {
            socket.emit('error-message', {
                message: `Error joining game with ID "${data.gid}".`
            });
        }
    });

    socket.on('restart-game', (data: Socket.GameRequest) => {

        if (games[data.gid] && games[data.gid].hid === data.pid) {
            games[data.gid].restart();
        }

    });

    socket.on('game', (data: Socket.GameRequest) => {

        if (games[data.gid]) {

            if (games[data.gid].players.check(data.pid)) {

                socket.emit('game', games[data.gid].getState(data.pid));

            } else {

                socket.emit('error-message', {
                    message: `Player ${data.pid} is not a member of game ${data.gid}.`
                });
                socket.emit('redirect', ['/join', data.gid]);

            }

        } else {

            socket.emit('error-message', {
                message: `Game with ID ${data.gid} does not exist.`
            });
            socket.emit('redirect', ['/']);

        }

    });

    socket.on('pick-white', (data: Socket.PickWhite) => {

        if (games[data.gid]) {

            if (games[data.gid].players.check(data.pid)) {

                if (games[data.gid].pickWhite(data.pid, data.card)) {
                    socket.emit('game', games[data.gid].getState(data.pid));
                } else {
                    socket.emit('error-message', {
                        message: 'Error selecting card'
                    });
                }

            } else {

                socket.emit('error-message', {
                    message: `Player ${data.pid} is not a member of game`
                });

            }

        } else {

            socket.emit('error-message', {
                message: `Game ${data.gid} does not exist`
            });

        }

    });

    socket.on('blank-card', (data: Socket.CustomWhite) => {

        if (games[data.gid] && players[data.pid]) {

            if (games[data.gid].players.check(data.pid)) {

                if (!games[data.gid].blankPick(data)) {
                    socket.emit('error-message', {
                        message: 'Error playing blank card'
                    });
                }

            } else {

                socket.emit('error-message', {
                    message: `Player ${data.pid} is not a member of game`
                });

            }

        } else {

            socket.emit('error-message', {
                message: 'Error playing card'
            });

        }

    });

    socket.on('pick-winner', (data: Socket.PickWinner) => {

        if (data.pid && games[data.gid] && data.winner) {
            games[data.gid].pickWinner(data.winner);
        } else {
            socket.emit('error-message', {
                message: 'Error selecting winner'
            });
        }

    });

    socket.on('leave-game', (data: Socket.GameRequest) => {
        if (data.pid && data.gid && games[data.gid]) {
            if (games[data.gid].players.check(data.pid)) {
                games[data.gid].players.remove(players[data.pid]);
                if (!games[data.gid].players.amount()) {
                    delete games[data.gid];
                }
            }
        } /* else {
            socket.emit('error-message', {
                message: `Error leaving game with ID "${data.gid}"`
            });
        } */
    });

    socket.on('error', e => {
        log.error(e);
    });

    socket.on('disconnect', () => {

        for (const p in players) {

            if (players[p].socket.id === socket.id) {

                // console.log(`Player ${players[p].id} has left the game.`);

                for (const g in games) {
                    if (games[g].players.check(players[p].id)) {
                        games[g].players.remove(players[p]);
                        if (!games[g].players.amount()) {
                            delete games[g];
                        }
                    }
                }

                delete players[p];

            }

        }

    });

    socket.on('info', async () => {
        const info: IInfo = {
            stats: getStats(players, games),
            stack: await getStack()
        };
        socket.emit('info', info);
    });


});

if (env.NODE_ENV === 'dev') {
    app.get('/i', async (_req, res) => {

        interface IDevPath {
            // tslint:disable-next-line:no-any
            players: any[];
            // tslint:disable-next-line:no-any
            games: any[];
            stats: Stats;
            stack: Stack;
        }

        const resData: IDevPath = {
            players: [],
            games: [],
            stats: getStats(players, games),
            stack: await getStack()
        };

        // tslint:disable-next-line:forin
        for (const p in players) {
            resData.players.push({
                username: players[p].username,
                score: players[p].score,
                inGame: players[p].inGame,
                blanksPlayed: players[p].blanksPlayed,
                hand: players[p].hand,
                picks: players[p].picks,
            });
        }

        // tslint:disable-next-line:forin
        for (const g in games) {
            resData.games.push({
                gid: g,
                hid: games[g].hid,
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                czar: games[g]._czar,
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                packs: games[g]._packs,
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                playedCards: games[g]._playedCards,
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                round: games[g]._bIndex,
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                players: Object.keys(games[g]._players).map(p => {
                    return {
                        id: p,
                        username: players[p].username,
                        score: players[p].score,
                        inGame: players[p].inGame,
                        blanksPlayed: players[p].blanksPlayed,
                        hand: players[p].hand,
                        picks: players[p].picks
                    };
                })
            });
        }

        res.json(resData);

        log.debug(JSON.stringify(resData, null, 4));

    });
}

app.use(express.static(path.join(process.cwd(), '..', 'client', 'dist')));

app.get('**', async (_req, res) => {

    res.sendFile(path.join(process.cwd(), '..', 'client', 'dist', 'index.html'));

});

// Remove games older than 12 hours. // Not needed since games get removed when there are no players left.
// setInterval(() => {

//     for (const game in games) {

//         if(new Date().getTime() - games[game].created > 12 * 3600 * 1000) {
//             delete games[game];
//         }

//     }

// }, 1000 * 1800);
