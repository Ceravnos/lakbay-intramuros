import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        process.env.FRONTEND_URL,
        "https://lakbay-intramuros.onrender.com"
      ].filter(Boolean),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a room based on user ID for targeted notifications
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`[Socket] User ${userId} joined their room`);
      }
    });

    // Join guide room for guide-specific updates
    socket.on("join-guide", (guideId) => {
      if (guideId) {
        socket.join(`guide-${guideId}`);
        console.log(`[Socket] Guide ${guideId} joined guide room`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Emit booking update to specific guide
export const emitToGuide = (guideId, event, data) => {
  if (io) {
    io.to(`guide-${guideId}`).emit(event, data);
  }
};

// Emit booking update to specific user
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};
