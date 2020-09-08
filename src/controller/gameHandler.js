import { Room } from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';
import { TURN_TIMEOUT, MAX_NUMBER, MIN_NUMBER, MAX_CHANCES, MAX_CLIENTS, GUESS_THRESHOLD } from '../env';
import logger from '../middlewares/logger';

class Player extends Schema {
    @type('string') username;
    @type('number') chancesPlayed = 0;
}

class State extends Schema {
    @type('string') currentTurn;
    @type({ map: Player }) players = new MapSchema();
    @type('number') secretNumber;
    @type('string') winner;
    @type('boolean') draw;
}

export default class RandomGuessRoom extends Room {
    onCreate() {
        this.setState(new State());

        this.onMessage('guess', (client, message) => this.playerAction(client, message));

        this.onMessage('*', (client, type, message) => {
            logger.info('[Suspicious Behavior] ', client.sessionId, ' sent', type, message);
        });
    }

    onJoin(client) {
        this.state.players[client.sessionId] = new Player();
        if (Object.keys(this.state.players).length === MAX_CLIENTS) {
            this.state.currentTurn = client.sessionId;
            this.setAutoMoveTimeout();

            // Lock the room after MAX_CLIENTS limit is reached
            this.lock();
        }
    }

    onLeave(client) {
        delete this.state.players[client.sessionId];
        if (this.randomGuessTimeout) {
            this.randomGuessTimeout.clear();
        }

        const remainingPlayerIds = Object.keys(this.state.players);
        if (remainingPlayerIds.length > 0) {
            this.state.winner = remainingPlayerIds[0];
        }
    }

    setAutoMoveTimeout() {
        if (this.randomGuessTimeout) {
            this.randomGuessTimeout.clear();
        }

        this.randomGuessTimeout = this.clock.setTimeout(() => this.pickRandomNumber(), TURN_TIMEOUT * 1000);
    }

    pickRandomNumber() {
        const sessionId = this.state.currentTurn;
        const guessedNumber = (Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) << 0;
        return this.playerAction({ sessionId }, { guessedNumber });
    }

    incrementPlayerChance(client) {
        const player = this.state.players[client.sessionId];
        player.chancesPlayed += 1;
        return player;
    }

    checkWin(client, guessedNumber) {
        const { secretNumber } = this.state;

        if (guessedNumber === this.state.secretNumber) {
            return true;
        }

        if (Math.abs(guessedNumber - secretNumber) <= GUESS_THRESHOLD) {
            this.send(client, 'You are very close to answer. 🔥🔥');
        }

        this.send(client, 'Try harder, you nowhere near 🥶🥶');
        return false;
    }

    isGameEnd() {
        const { players } = this.state;
        // eslint-disable-next-line no-unused-vars
        for (const [_playerId, data] of Object.entries(players)) {
            if (data.chancesPlayed !== MAX_CHANCES) {
                return false;
            }
        }

        return true;
    }

    playerAction(client, data) {
        if (this.state.winner || this.state.draw) {
            return false;
        }

        if (client.sessionId === this.state.currentTurn) {
            this.state.players[client.sessionId] = this.incrementPlayerChance(client);

            const { guessedNumber } = data;
            const { players, secretNumber } = this.state;
            const player = players[client.sessionId];

            this.broadcast(`Player ${player.username} guessed ${guessedNumber}`, { except: client });

            if (this.checkWin(client, guessedNumber)) {
                this.state.winner = client.sessionId;
                this.broadcast(`Player ${player.username} is the Winner, number was ${secretNumber}`, {
                    afterNextPatch: true
                });
            } else if (this.isGameEnd()) {
                this.state.draw = true;
                this.broadcast(`Game Ends in Draw, the number was ${secretNumber}`, {
                    afterNextPatch: true
                });
            } else {
                // Switch turns
                const sortedOrderPlayers = this.state.players.sort((arg1, arg2) => {
                    return arg1.chancesPlayed > arg2.chancesPlayed ? 1 : -1;
                });
                const otherPlayerSessionId = Object.keys(sortedOrderPlayers)[0];

                this.state.currentTurn = otherPlayerSessionId;

                this.setAutoMoveTimeout();
            }
        }
    }
}
