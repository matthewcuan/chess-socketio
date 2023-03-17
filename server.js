import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import initGame from './socket.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://melodious-speculoos-b36439.netlify.app",
        methods: ["GET", "POST"],
        credentials: true,
    }
});

io.on("connection", (socket) => {

    console.log('a user connected');
    initGame(io, socket);
    
});

const port = process.env.PORT || 5000

server.listen(port, () => {
    console.log(`socket listening on port ${port}`);
});