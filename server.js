import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import initGame from './socket.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    }
});

io.on("connection", (socket) => {

    console.log('a user connected');
    initGame(io, socket);
    
});

server.listen(process.env.PORT || 5000, () => {
    console.log("socket listening on port 5000");
});