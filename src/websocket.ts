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

  async getUserEachRoom() {
    return Object.keys(this.rooms).map((key: string) => {
      return {
        room: key,
        count: this.rooms[key].length,
      };
    });
  }

  async getTotalUsers() {
    return Object.keys(this.cons).length;
  }

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
