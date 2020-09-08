import { Room } from 'colyseus';
import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';
import { TURN_TIMEOUT } from '../env';
import logger from '../logger';

class Player extends Schema {
    @type('string') username;
    @type('number') x = 0;
    @type('number') chancesPlayed = 0;
}

class State extends Schema {
    @type('string') currentTurn;
    @type({ map: Player }) players = new MapSchema();
    @type('number') secretNumber;
    @type('string') winner;
}

export default class GameRoom extends Room {
    onCreate() {
        this.setState(new State());

        this.onMessage('guess', (client, data) => {
            // Player Action port
            const player = this.state.players[client.sessionId];
            player.x = data.guessedNumber;

            // Change turn
            this.state.currentTurn =
                // Send to all players except the sender
                this.broadcast(`Player ${player.username} guessed ${data.guessedNumber}`, { except: client });
            logger.info(`Player ${player.username} guessed ${data.guessedNumber}`);
        });

        this.onMessage('*', (client, type, message) => {
            logger.info('[Suspicious Behavior] ', client.sessionId, ' sent', type, message);
        });
    }

    onJoin(client) {
        this.state.players[client.sessionId] = new Player();
        if (Object.keys(this.state.players).length === 4) {
            this.state.currentTurn = client.sessionId;
            this.setAutoMoveTimeout();

            // Lock the room after 4 people
            this.lock();
        }
    }

    onLeave(client) {
        delete this.state.players[client.sessionId];
    }

    setAutoMoveTimeout() {
        if (this.randomMoveTimeout) {
            this.randomMoveTimeout.clear();
        }

        this.randomMoveTimeout = this.clock.setTimeout(() => this.pickRandomNumber(), TURN_TIMEOUT * 1000);
    }

    doRandomMove() {
        const sessionId = this.state.currentTurn;
        const x = 5;
        return this.playerAction({ sessionId }, { x });
    }

    incrementPlayerChance(playerInfo) {
        playerInfo.chancesPlayed += 1;
        return playerInfo;
    }

    playerAction(client, data) {
        if (this.state.winner || this.state.draw) {
            return false;
        }

        if (client.sessionId === this.state.currentTurn) {
            const outdatedInfo = this.state.players[client.sessionId];
            outdatedInfo.chancesPlayed += 1;
            this.state.players[client.sessionId] = outdatedInfo;
            const playerIds = Object.keys(this.state.players);
            const { guessedNumber } = data;

            if (this.checkWin(guessedNumber)) {
                this.state.winner = client.sessionId;
            } else if (this.isGameEnd()) {
                this.state.draw = true;
            } else {
                // Switch turn
                const otherPlayerSessionId = client.sessionId === playerIds[0] ? playerIds[1] : playerIds[0];

                this.state.currentTurn = otherPlayerSessionId;

                this.setAutoMoveTimeout();
            }
        }
    }
}
