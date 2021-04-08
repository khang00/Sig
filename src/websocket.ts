import { Server, Socket } from "socket.io";
import * as http from "http";
import { DataRecord, Persistence } from "./persistence";

type Username = string;
type SocketId = string;
type RoomName = string;

enum SignalingEvents {
  Connected = "connection",
  Login = "login",
  RoomDetails = "roomDetails",
  JoinRoom = "joinRoom",
  CreateRoom = "createRoom",
  Signal = "signal",
  Initiate = "initiate",
}

interface Data {
  from: Username;
  to: Username;
  content: String;
}

interface Room {
  roomName: string;
  users: Username[];
}

class ChatRoom extends DataRecord implements Room {
  roomName: RoomName;
  users: Username[];

  constructor(roomName: RoomName) {
    super(roomName);
    this.roomName = roomName;
    this.users = [];
  }
}

export default class Signaling {
  io: Server;
  cons: Record<Username, SocketId>;
  roomDB: Persistence<ChatRoom>;

  constructor(server: http.Server, database: Persistence<ChatRoom>) {
    this.roomDB = database;
    this.cons = {};
    this.io = new Server(server, {
      path: "/ws",
      cookie: false,
      cors: {
        origin: "*"
      }
    });
    this.io.on("connection", this.onConnection);
  }

  async getUserEachRoom() {
    const records = this.roomDB.getAll();
    if (records !== undefined) {
      return records.map(({ roomName, users }) => {
        return {
          room: roomName,
          count: users.length
        };
      });
    } else return [];
  }

  async getTotalUsers() {
    return Object.keys(this.cons).length;
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
      const room = this.roomDB.get(data.to);
      if (room === undefined) {
        console.error("error: room not exist");
      } else {
        socket.emit(SignalingEvents.RoomDetails, room.users);
      }
    });

    socket.on(SignalingEvents.JoinRoom, (data) => {
      const room = this.roomDB.get(data.to);
      if (room === undefined) {
        console.error("error: room not exist");
      } else {
        room.users.push(data.from);
        socket.join(data.to);
      }
    });

    socket.on(SignalingEvents.CreateRoom, (data) => {
      const room = this.roomDB.get(data.to);
      if (room === undefined) {
        const createdRoom = this.roomDB.save(new ChatRoom(data.to));
        if (createdRoom !== undefined) {
          createdRoom.users.push(data.from);
          socket.join(data.to);
        } else console.error("error: failed to create new room");
      } else console.error("error: room already exist");
    });

    socket.on(SignalingEvents.Signal, (data) => {
      socket.to(this.cons[data.to]).emit(SignalingEvents.Signal, data);
    });

    socket.on(SignalingEvents.Initiate, (data) => {
      socket.to(this.cons[data.to]).emit(SignalingEvents.Initiate, data);
    });
  };
}

export { ChatRoom };
