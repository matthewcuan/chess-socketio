let io
let liveGames = {}

// returns black or white randomly
function blackOrWhite() {
    const number = Math.floor(Math.random() * 9);
    if (number > 4) {
        return "white";
    } else {
        return "black";
    }
}

// set orientation of board
var orientation = blackOrWhite();
var user = "";
var gameId = "";

const initGame = (sio, socket) => {
    
    io = sio;
    let theUser


    socket.on("createNewGame", (game) => {
        var room = socket.adapter.rooms.get(`${game.id}`); // get the room object
        user = game.user;
        theUser = game.user;
        gameId = game.id;

        // if room doesn't exist join/create new room
        // emits board position and "game init" message
        if (!room) {
            socket.join(game.id);
            io.to(socket.id).emit('board position', orientation);
            io.to(socket.id).emit('message', "Game initiated... waiting for other player");
            room = socket.adapter.rooms.get(`${game.id}`);
            liveGames[game.id] = {history: ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'], users: [user], winner: "" };
        }

        // if room is not full yet
        // socket joins room, flips board if someone is in there
        // emits board orientation, "game start" message, and adds game to liveGames
        if (parseInt(room.size) < 2) {
            socket.join(game.id);
            console.log(orientation);
            console.log(room.size);
            if (parseInt(room.size) === 1) {
                console.log("changing orientation")
                if (orientation === "white") {
                    orientation = "black";
                } else {
                    orientation = "white";
                }
            } else {                    
                io.to(socket.id).emit('board position', orientation);
                io.to(socket.id).emit('message', "Joined! Game started... white's move");
                socket.broadcast.to(game.id).emit('message', game.user + " joined! Game started... white's move")
                liveGames[game.id].users.push(user);
                console.log(liveGames[game.id].users);
            }
            
            console.log(`${game.user} joined room ${game.id}`);
        
        // if there are two players in the room already
        // alerts user attempting to connect and returns them to home page
        } else {
            console.log("room full");
            io.to(socket.id).emit('room full', "This game is full. Please try another room!")
            return ;
        }

        console.log(socket.adapter.rooms.get(`${game.id}`).size);

    });

    // emits each time one of the users makes a new move
    socket.on('new move', (fen) => {
        console.log("a new move was made");
        liveGames[gameId].history.push(fen);
        io.emit('new move', fen);
        console.log(liveGames[gameId])
    })

    // emits when a message is sent in global chat
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    // emits when a user disconnects from socket
    socket.on('disconnect', () => {
        console.log(liveGames[gameId]);
        liveGames[gameId].winner = liveGames[gameId].users.find(obj => obj !== theUser);
        console.log(liveGames[gameId].winner);
        socket.broadcast.to(gameId).emit('message', "Opponent left. You won by abandonment.");
        console.log(`sending save data to ${gameId}`);
        io.to(gameId).emit('save options', liveGames[gameId]);
        console.log('user disconnected');
        console.log(socket.adapter.sids.size);
    });

    // emits when user exits game
    socket.on('exit message', (msg) => {
        io.to(socket.id).emit('message', msg);
    })

    // emits when game ends either from resignment or checkmate
    socket.on('game end', (msgs) => {
        liveGames[gameId].winner = theUser;
        console.log(liveGames[gameId].winner);
        io.to(socket.id).emit('message', msgs.winner);
        socket.broadcast.to(gameId).emit('message', msgs.loser)
        io.to(gameId).emit('save options', liveGames[gameId]);
        io.to(gameId).emit('end game');
        console.log("sending history")
        io.to(gameId).emit('save data', liveGames[gameId]);
    })

    // emits when user attempts to replay game
    socket.on('restart game', () => {
        console.log("restarting")
        io.to(gameId).emit('message', "New game started.");
        io.to(gameId).emit('end game');
    })

    // emits when message from user or server is sent in a room
    socket.on('message', (msg) => {
        console.log('message: ' + msg.chat + " to " + msg.gameId);
        io.to(gameId).emit('message', msg.chat);
    });
}

export default initGame