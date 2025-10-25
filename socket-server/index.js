import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import { saveUserScore, getUserHighScore } from "./appwrite.js";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {},
});

const rooms = new Map();
const gameStates = new Map(); // Store game state for each room

// Function to load words from file
function loadWords(difficulty = "intermediate") {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "words",
      `${difficulty}.txt`
    );
    const wordsText = fs.readFileSync(filePath, "utf8");
    return wordsText
      .split("\n")
      .map((word) => word.trim())
      .filter(Boolean);
  } catch (error) {
    console.error(`Error loading ${difficulty} words:`, error);
    // Fallback to beginner words
    const fallbackPath = path.join(
      process.cwd(),
      "public",
      "words",
      "intermediate.txt"
    );
    const wordsText = fs.readFileSync(fallbackPath, "utf8");
    return wordsText
      .split("\n")
      .map((word) => word.trim())
      .filter(Boolean);
  }
}

// Function to get random words
function getRandomWords(words, count = 10) {
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  socket.on("create-room", ({ roomid, username, userId }) => {
    rooms.set(roomid, [{ socketId: socket.id, username, userId }]);
    socket.join(roomid);
    console.log(`Room ${roomid} created by ${username} (ID: ${userId})`);
    socket.emit("room-created", { roomid });

    io.to(roomid).emit("room-users", {
      users: rooms.get(roomid),
    });
  });

  socket.on("join-room", ({ roomid, username, userId }) => {
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
      room.push({ socketId: socket.id, username, userId });
    }

    socket.join(roomid);
    console.log(roomid);
    console.log(rooms.get(roomid));

    io.to(roomid).emit("room-users", {
      users: rooms.get(roomid),
    });
  });

  socket.on("start-game", ({ roomid, difficulty = "beginner" }) => {
    const room = rooms.get(roomid);

    if (!room) {
      socket.emit("room-not-found");
      return;
    }

    // Check if the user starting the game is in the room
    const userInRoom = room.find((user) => user.socketId === socket.id);
    if (!userInRoom) {
      return;
    }

    // Initialize game state
    const words = loadWords(difficulty);
    const gameWords = getRandomWords(words, 10);

    // Initialize scores and individual progress for all users
    const users = room.map((user) => ({
      ...user,
      score: 0,
      currentWordIndex: 0,
      isFinished: false,
    }));

    const gameState = {
      words: gameWords,
      totalRounds: gameWords.length,
      users: users,
      gameStarted: true,
      gameEnded: false,
    };

    gameStates.set(roomid, gameState);

    io.to(roomid).emit("game-started", {
      roomid,
      startedBy: userInRoom.username,
      gameState: {
        totalRounds: gameState.totalRounds,
        users: gameState.users,
        words: gameState.words, // Send words to frontend
      },
    });

    console.log(`Game started in room ${roomid} by ${userInRoom.username}`);
  });

  socket.on("play-word", ({ roomid, wordIndex }) => {
    const gameState = gameStates.get(roomid);

    if (!gameState || gameState.gameEnded) {
      return;
    }

    const userInGame = gameState.users.find(
      (user) => user.socketId === socket.id
    );
    if (!userInGame || wordIndex >= gameState.words.length) {
      return;
    }

    const currentWord = gameState.words[wordIndex];

    // Emit the word only to the requesting user
    socket.emit("word-audio", {
      word: currentWord,
      wordIndex: wordIndex,
    });
  });

  socket.on("submit-answer", ({ roomid, answer, wordIndex }) => {
    const gameState = gameStates.get(roomid);
    const room = rooms.get(roomid);

    if (!gameState || gameState.gameEnded || !room) {
      return;
    }

    const userInRoom = room.find((user) => user.socketId === socket.id);
    const userInGame = gameState.users.find(
      (user) => user.socketId === socket.id
    );

    if (!userInRoom || !userInGame || wordIndex >= gameState.words.length) {
      return;
    }

    const currentWord = gameState.words[wordIndex];
    const isCorrect = answer.toLowerCase() === currentWord.toLowerCase();

    // Update user score
    if (isCorrect) {
      userInGame.score += 10;
    } else {
      userInGame.score = Math.max(0, userInGame.score - 5);
    }

    // Move this user to next word
    userInGame.currentWordIndex++;

    // Check if this user finished all words
    if (userInGame.currentWordIndex >= gameState.words.length) {
      userInGame.isFinished = true;
    }

    // Emit result to all users (so they can see each other's progress)
    io.to(roomid).emit("answer-result", {
      username: userInRoom.username,
      answer: answer,
      correct: isCorrect,
      correctWord: currentWord,
      users: gameState.users,
      socketId: socket.id,
      wordIndex: wordIndex,
    });

    // Emit individual progress update to the user who submitted
    socket.emit("user-progress", {
      currentWordIndex: userInGame.currentWordIndex,
      isFinished: userInGame.isFinished,
      score: userInGame.score,
    });

    // Check if all users are finished
    const allFinished = gameState.users.every((user) => user.isFinished);
    if (allFinished) {
      gameState.gameEnded = true;

      // Determine winner (highest score)
      const winner = gameState.users.reduce((prev, current) =>
        prev.score > current.score ? prev : current
      );

      // Save scores to database for all users
      const savePromises = gameState.users.map(async (user) => {
        try {
          if (user.userId) { // Only save if user has a valid userId
            await saveUserScore(user.userId, user.score, 'multiplayer');
            console.log(`✅ Saved score ${user.score} for user ${user.username} (${user.userId})`);
          } else {
            console.log(`⚠️ No userId found for user ${user.username}, skipping score save`);
          }
        } catch (error) {
          console.error(`❌ Failed to save score for user ${user.username}:`, error);
        }
      });

      // Wait for all scores to be saved (but don't block the game ending)
      Promise.allSettled(savePromises).then((results) => {
        const successCount = results.filter(result => result.status === 'fulfilled').length;
        console.log(`📊 Score saving completed: ${successCount}/${gameState.users.length} successful`);
      });

      io.to(roomid).emit("game-ended", {
        winner: winner,
        finalScores: gameState.users.sort((a, b) => b.score - a.score),
      });

      // Clean up game state
      gameStates.delete(roomid);
    }
  });

  socket.on("next-word", ({ roomid, wordIndex }) => {
    const gameState = gameStates.get(roomid);

    if (!gameState || gameState.gameEnded) {
      return;
    }

    const userInGame = gameState.users.find(
      (user) => user.socketId === socket.id
    );

    if (!userInGame) {
      return;
    }

    // Move this user to next word (skip current word)
    userInGame.currentWordIndex++;

    // Check if this user finished all words
    if (userInGame.currentWordIndex >= gameState.words.length) {
      userInGame.isFinished = true;
    }

    // Emit individual progress update to the user who skipped
    socket.emit("user-progress", {
      currentWordIndex: userInGame.currentWordIndex,
      isFinished: userInGame.isFinished,
      score: userInGame.score,
    });

    // Emit to all users so they can see updated scores
    io.to(roomid).emit("users-updated", {
      users: gameState.users,
    });

    // Check if all users are finished
    const allFinished = gameState.users.every((user) => user.isFinished);
    if (allFinished) {
      gameState.gameEnded = true;

      // Determine winner
      const winner = gameState.users.reduce((prev, current) =>
        prev.score > current.score ? prev : current
      );

      // Save scores to database for all users
      const savePromises = gameState.users.map(async (user) => {
        try {
          if (user.userId) { // Only save if user has a valid userId
            await saveUserScore(user.userId, user.score, 'multiplayer');
            console.log(`✅ Saved score ${user.score} for user ${user.username} (${user.userId})`);
          } else {
            console.log(`⚠️ No userId found for user ${user.username}, skipping score save`);
          }
        } catch (error) {
          console.error(`❌ Failed to save score for user ${user.username}:`, error);
        }
      });

      // Wait for all scores to be saved (but don't block the game ending)
      Promise.allSettled(savePromises).then((results) => {
        const successCount = results.filter(result => result.status === 'fulfilled').length;
        console.log(`📊 Score saving completed: ${successCount}/${gameState.users.length} successful`);
      });

      io.to(roomid).emit("game-ended", {
        winner: winner,
        finalScores: gameState.users.sort((a, b) => b.score - a.score),
      });

      // Clean up game state
      gameStates.delete(roomid);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);

    // Remove user from all rooms
    for (const [roomid, users] of rooms.entries()) {
      const userIndex = users.findIndex((user) => user.socketId === socket.id);
      if (userIndex !== -1) {
        users.splice(userIndex, 1);

        // If room is empty, delete it and its game state
        if (users.length === 0) {
          rooms.delete(roomid);
          gameStates.delete(roomid);
        } else {
          // Update game state users
          const gameState = gameStates.get(roomid);
          if (gameState) {
            const gameUserIndex = gameState.users.findIndex(
              (user) => user.socketId === socket.id
            );
            if (gameUserIndex !== -1) {
              gameState.users.splice(gameUserIndex, 1);
            }
          }

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
      const userIndex = room.findIndex((user) => user.socketId === socket.id);
      if (userIndex !== -1) {
        room.splice(userIndex, 1);
      }

      // Leave the socket room
      socket.leave(roomid);

      // Delete room if empty
      if (room.length === 0) {
        rooms.delete(roomid);
        gameStates.delete(roomid);
      } else {
        // Update game state
        const gameState = gameStates.get(roomid);
        if (gameState) {
          const gameUserIndex = gameState.users.findIndex(
            (user) => user.socketId === socket.id
          );
          if (gameUserIndex !== -1) {
            gameState.users.splice(gameUserIndex, 1);
          }
        }

        // Update remaining users
        io.to(roomid).emit("room-users", {
          users: rooms.get(roomid),
        });
      }
    }
  });
});

httpServer.listen(3001);
