# Turn Based Multiplayer Game

## About
- Uses Colyseus Engine
- Guess the number presented to you by the Server
- Know when you are close to your answer or not!

## Game Rules
- The server decides on a number between 1 and 20.
- On each turn, each player has to guess the number selected by the server.
- Each player has 10 seconds to make the guess.
- If the guess made by the player is correct, he/she wins.
- If its incorrect, the server should respond with ‘hot’ if it’s within 3 number distance(+/-), otherwise cold. This response message is only visible to the player who made the turn. But everyone can see which number was attempted by the player.
- Each player take turns to guess. The game ends when the number is found or when each player is out of 3 chances to guess the number.
- Lobby present, where all players who connect initially are sent to the lobby.
- Room is locked on player limit
