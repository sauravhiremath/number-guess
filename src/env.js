export const TURN_TIMEOUT = 10;
export const MAX_NUMBER = 20;
export const MIN_NUMBER = 1;
export const MAX_CHANCES = 3;
export const MAX_CLIENTS = 4;
export const GUESS_THRESHOLD = 3;
export const API_PORT = 6000;
export let HOSTS = [];
if (process.env.NODE_ENV === 'production') {
    HOSTS = ['https://game.example.com', 'https://game2.example.com'];
} else {
    // Whitelisting Client Endpoints
    HOSTS = ['http://localhost:5000'];
}
