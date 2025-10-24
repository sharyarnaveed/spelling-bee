import { createServer } from "http";
import { Server } from "socket.io";
const httpServer = createServer();
const io = new Server(httpServer, {
 cors: {
    origin: "*", 
  },
});

const rooms=new Map()

io.on("connection", (socket) => {
    console.log('⚡ New client connected:', socket.id)


socket.on("create-room", ({ roomid, username }) => {
  rooms.set(roomid, [{ socketId: socket.id, username }]);
  socket.join(roomid);
  console.log(`Room ${roomid} created by ${username}`);
  socket.emit("room-created", { roomid });

 
  io.to(roomid).emit("room-users", {
    users: rooms.get(roomid),
  });
});

socket.on("join-room", ({ roomid, username }) => {
  const room = rooms.get(roomid);
console.log(room);

  if (!room) {
    socket.emit("room-not-found");
    return;
  }

  if (room.length > 2) {
    socket.emit("room-full");
    return;
  }

  // Prevent duplicate socketId or username
  const alreadyInRoom = room.some(
    (user) => user.socketId === socket.id || user.username === username
  );
  if (!alreadyInRoom) {
    room.push({ socketId: socket.id, username });
  }

  socket.join(roomid);
console.log(roomid);
console.log(rooms.get(roomid));

  io.to(roomid).emit("room-users", {
    users: rooms.get(roomid),
  });
});

socket.on('disconnect', () => {
  console.log('❌ Client disconnected:', socket.id);
  
  // Remove user from all rooms
  for (const [roomid, users] of rooms.entries()) {
    const userIndex = users.findIndex(user => user.socketId === socket.id);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
      
      // If room is empty, delete it
      if (users.length === 0) {
        rooms.delete(roomid);
      } else {
        // Notify remaining users
        io.to(roomid).emit("room-users", {
          users: rooms.get(roomid),
        });
      }
      break;
    }
  }
});

socket.on("leave-room", ({ roomid }) => {
  const room = rooms.get(roomid);
  
  if (room) {
    // Remove user from room array
    const userIndex = room.findIndex(user => user.socketId === socket.id);
    if (userIndex !== -1) {
      room.splice(userIndex, 1);
    }
    
    // Leave the socket room
    socket.leave(roomid);
    
    // Delete room if empty
    if (room.length === 0) {
      rooms.delete(roomid);
    } else {
      // Update remaining users
      io.to(roomid).emit("room-users", {
        users: rooms.get(roomid),
      });
    }
  }
});

});

httpServer.listen(3001);