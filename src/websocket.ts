import { Server, Socket } from "socket.io";
import * as http from "http";

type UserName = string;
type SocketId = string;
type RoomName = string;

enum SignalingEvents {
  Connected = "connection",
  Login = "login",
  RoomDetails = "getRoomDetails",
  JoinRoom = "joinRoom",
  CreateRoom = "createRoom",
  Signal = "signal",
  Initiate = "initiate",
}

interface Data {
  from: UserName;
  to: UserName;
  content: String;
}

export default class Signaling {
  io: Server;
  rooms: Record<RoomName, Array<RoomName>>;
  cons: Record<UserName, SocketId>;

  constructor(server: http.Server) {
    this.rooms = {};
    this.cons = {};
    this.io = new Server(server, {
      path: "/ws",
      cookie: false,
      cors: {
        origin: "*",
      },
    });
    this.io.on("connection", this.onConnection);
  }

  onConnection = (socket: Socket) => {
    socket.emit(SignalingEvents.Connected, "");
    socket.on("disconnecting", (reason) => {
      Object.keys(this.cons).forEach((username) => {
        if (this.cons[username] === socket.id) {
          delete this.cons[username];
        }
      });
    });
    socket.on(SignalingEvents.Login, (username) => {
      this.cons[username] = socket.id;
    });
    socket.on(SignalingEvents.RoomDetails, (data) => {
      socket.emit("roomDetails", this.rooms[data.to]);
    });
    socket.on(SignalingEvents.JoinRoom, (data) => {
      socket.join(data.to);
      this.rooms[data.to].push(data.from);
    });
    socket.on(SignalingEvents.CreateRoom, (data) => {
      socket.join(data.to);
      this.rooms[data.to].push(data.from);
    });
    socket.on(SignalingEvents.Signal, this.onSignal);
    socket.on(SignalingEvents.Initiate, this.onInitiate);
  };

  onSignal(data: Data) {
    this.io.to(this.cons[data.to]).emit(SignalingEvents.Signal, data);
  }

  onInitiate(data: Data) {
    this.io.to(this.cons[data.to]).emit(SignalingEvents.Initiate, data);
  }
}

/*
io.on("connection", (socket) => {
  socket.emit("connection", "");
  socket.on("login", (username) => {
    LOGIN_USER[username] = socket.id;
    console.log(`${username} login`);
  });

  socket.on("getRoomDetails", (data) => {
    const room = ROOMS.get(data.to);
    socket.emit("roomDetails", room);
    console.log(
      "get room details: ",
      JSON.stringify(room),
      JSON.stringify(ROOMS)
    );
  });

  socket.on("joinRoom", (data) => {
    socket.join(data.to);
    ROOMS.get(data.to).push(data.from);
    console.log(`join room: ${ROOMS.toString()}`);
  });

  socket.on("createRoom", (data) => {
    socket.join(data.to);
    ROOMS.get(data.to).push(data.from);
    console.log(`join room: ${ROOMS.toString()}`);
  });

  socket.on("createRoom", (data) => {
    socket.join(data.from);
    ROOMS.set(data.from, [data.from]);
    console.log(`create room: ${ROOMS.toString()}`);
  });

  socket.on("signal", (data) => {
    io.to(LOGIN_USER[data.to]).emit("signal", data);
  });

  socket.on("initiate", (data) => {
    io.to(LOGIN_USER[data.to]).emit("initiate", data);
  });

  socket.on("disconnecting", (reason) => {
    console.log(reason);
    Object.keys(LOGIN_USER).forEach((username) => {
      if (LOGIN_USER[username] === socket.id) {
        delete LOGIN_USER[username];
      }
    });
  });
}
*/
