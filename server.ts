import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Type for the decoded JWT payload
interface DecodedToken {
  companyId: string;
}

// Middleware to handle authentication and extract companyId from the token
io.use((socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.query.token as string;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as DecodedToken;
      socket.data.companyId = decoded.companyId; // Store companyId in the socket object
      next();
    } catch (err) {
      console.log('Authentication error:', (err as Error).message);
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('No token provided'));
  }
});

// Handle new client connections
io.on('connection', (socket: Socket) => {
  const companyId = socket.data.companyId as string;

  if (companyId) {
    socket.join(companyId);
    console.log(`User ${socket.id} joined room: ${companyId}`);

    socket.on('newOrder', (orderData: { companyId: string; [key: string]: any }) => {
      io.to(companyId).emit('orderNotification', orderData);
      console.log(`New order notification sent to room: ${companyId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  } else {
    console.log('No companyId available, connection refused.');
    socket.disconnect();
  }
});

server.listen(8080, () => {
  console.log('WebSocket server is running on port 8080');
});
