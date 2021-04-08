import { Server, Socket } from "socket.io";
import http from "http";
import fs from "fs";
import SpaceMetrics from "./spaceMetrics";

export default class SpaceSocket {
  io: Server;
  users: any;
  socketToRoom: any;
  roomUpdateRequests: any;
  roomScreenShare: any;
  npcData: any;
  metrics: SpaceMetrics;

  constructor(server: http.Server, metrics: SpaceMetrics) {
    this.metrics = metrics;
    this.users = {};
    this.socketToRoom = {};
    this.roomUpdateRequests = {};
    this.roomScreenShare = {};
    this.npcData = [];
    this.npcData.push({
      id: "NPC",
      username: "NPC",
      model: "Waitress",
      colour: "White",
      x: 0,
      y: 0,
      z: 0,
      heading: Math.PI,
      pb: 0,
      action: "dance"
    });

    this.io = new Server(server, {
      path: "/ws",
      cookie: false,
      cors: {
        origin: "*"
      }
    });
    this.io.on("connection", this.onConnection);
  }


  onConnection(socket: Socket | any) {
    socket.userData = { x: 0, y: 0, z: 0, heading: 0 };//Default values;

    const USER_IP = socket.request.connection.remoteAddress;

    socket.emit("setId", { id: socket.id, npcs: this.npcData });

    socket.on("init", (data: any) => {
      console.log(`socket.init ${data.model}  ${data.colour}`);
      socket.userData.username = data.username;
      socket.userData.model = data.model;
      socket.userData.colour = data.colour;
      socket.userData.x = data.x;
      socket.userData.y = data.y;
      socket.userData.z = data.z;
      socket.userData.heading = data.h;
      socket.userData.pb = data.pb;
      socket.userData.action = "idle";

      this.roomUpdateRequests[this.socketToRoom[socket.id]] = true;
    });

    socket.on("update", (data: any) => {
      socket.userData.x = data.x;
      socket.userData.y = data.y;
      socket.userData.z = data.z;
      socket.userData.heading = data.h;
      socket.userData.pb = data.pb;
      socket.userData.action = data.action;
      socket.userData.headX = data.headX;
      socket.userData.headY = data.headY;

      this.roomUpdateRequests[this.socketToRoom[socket.id]] = true;
    });

    socket.on("onChangeFloor", (data: any) => {
      let roomID = this.socketToRoom[socket.id];
      this.io.to(roomID).emit("onChangeFloor", { id: socket.id, floorIndex: data.floorIndex });
    });

    socket.on("playVideo", (data: any) => {
      console.log("Start playing videos!!");
      const nsp = this.io.of("/") as any;
      let pack = [];

      for (let id in this.io.sockets.sockets) {
        const socket = nsp.connected[id];
        //Only push sockets that have been initialised
        if (socket.userData.model !== undefined) {
          pack.push({
            id: socket.id,
            action: "playVideo"
          });
        }
      }
      if (pack.length > 0) this.io.emit("playVideo", pack);

      this.roomUpdateRequests[this.socketToRoom[socket.id]] = true;
    });

    socket.on("chat message", (data: any) => {
      console.log(`chat message:${socket.id} -> ${data.id} ( ${data.message} )`);
      this.io.to(data.id).emit("chat message", {
        id: socket.id,
        message: data.message,
        username: socket.userData.username
      });

      this.roomUpdateRequests[this.socketToRoom[socket.id]] = true;
    });

    socket.on("turnLight", (data: any) => {
      console.log("Switch light " + (data.status ? "on" : "off") + "!!!");
      const nsp = this.io.of("/");
      let pack = {
        id: socket.id,
        status: data.status
      };
      this.io.emit("turnLight", pack);

      this.roomUpdateRequests[this.socketToRoom[socket.id]] = true;
    });

    socket.on("getRoomData", (payload: any) => {
      if (payload === "AllKnowledgeIsGoodKnowledge") {
        fs.readFile("../IP_logs.txt", (error, txtString) => {
          var data = "";
          if (!error) {
            data = txtString.toString();
          }
          socket.emit("roomData", data);
        });

        let userData = JSON.stringify(this.users);
        fs.writeFile("./UserData.txt", userData, (error) => {
          if (error) throw error;
        });
      }
    });

    socket.on("getRoomList", (payload: any) => {
      if (payload === "AllKnowledgeIsGoodKnowledge") {
        const nsp = this.io.of("/") as any;
        let roomList = {};
        Object.keys(this.users).forEach(roomID => {
          this.users[roomID].forEach((sID: any) => {
            // @ts-ignore
            if (roomList[roomID] === undefined) roomList[roomID] = [];
            let soc = nsp.connected[sID];
            // @ts-ignore
            roomList[roomID].push({ id: sID, data: nsp.connected[sID].userData });
          });
        });
        socket.emit("roomList", roomList);
      }
    });

    socket.on("customizeObject", (payload: any) => {
      let roomID = this.socketToRoom[socket.id];
      fs.readFile("../CustomObjectData.txt", (error, txtString) => {
        var jsonString = "{}";
        if (!error) {
          jsonString = txtString.toString();
        }
        var data = JSON.parse(jsonString);
        if (data === undefined) data = {};
        if (data[roomID] === undefined) data[roomID] = {};
        data[roomID][payload.meshID] = payload.data;

        this.io.to(roomID).emit("updateCustomObjects", data[roomID]);

        let dataString = JSON.stringify(data);
        fs.writeFile("../CustomObjectData.txt", dataString, (error) => {
          if (error) throw error;
        });
      });
    });

    socket.on("join room", (roomID: any) => {
      if (roomID === undefined || roomID === null) return;

      roomID = roomID.replace("#", "");

      if (roomID !== "Admin") {
        fs.readFile("../IP_logs.txt", (error, txtString) => {
          var data = "";
          if (!error) {
            data = txtString.toString();
          }

          const userTrackMetric = {
            ip: USER_IP,
            user: socket.userData.username,
            room: roomID,
            socket: socket.id
          };

          this.metrics.userTrack.inc(userTrackMetric);

          data += `${new Date()}: ${roomID} has user ${socket.userData.username} joined with socket ID: ${socket.id}\n`;
          fs.writeFile("../IP_logs.txt", data, (error) => {
            if (error) throw error;
          });
        });
      }

      if (this.users[roomID]) {
        this.users[roomID].push(socket.id);
      } else {
        this.users[roomID] = [socket.id];
      }
      this.socketToRoom[socket.id] = roomID;
      const usersInThisRoom = this.users[roomID].filter((id: any) => id !== socket.id);

      socket.join(roomID);
      socket.emit("all users", usersInThisRoom);
      if (this.roomScreenShare[roomID] !== undefined) {
        socket.emit("updateRoomStreams", this.roomScreenShare[roomID]);
      }

      fs.readFile("../CustomObjectData.txt", (error, txtString) => {
        if (!error) {
          let jsonString = txtString.toString();
          var data = JSON.parse(jsonString);
          if (data && data[roomID]) socket.emit("updateCustomObjects", data[roomID]);
        }
      });

      if (this.npcData) {
        socket.emit("updateNPCData", this.npcData);
      }

      this.roomUpdateRequests[roomID] = true;
    });

    socket.on("sending signal", (payload: any) => {
      this.io.to(payload.userToSignal).emit("user joined", { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", (payload: any) => {
      this.io.to(payload.callerID).emit("receiving returned signal", { signal: payload.signal, id: socket.id });
    });

    socket.on("disconnect", () => {
      console.log(`Player ${socket.id} disconnected`);
      socket.broadcast.emit("deletePlayer", { id: socket.id });

      const roomID = this.socketToRoom[socket.id];
      let room = this.users[roomID];
      if (room) {
        room = room.filter((id: any) => id !== socket.id);
        this.users[roomID] = room;
      }

      this.roomUpdateRequests[roomID] = true;
    });

    socket.on("share screen", (data: any) => {
      let roomID = this.socketToRoom[socket.id];
      if (this.roomScreenShare[roomID] === undefined) this.roomScreenShare[roomID] = {};
      this.roomScreenShare[roomID][data.screenID] = data.streamID;
      this.io.to(roomID).emit("share screen", {
        callerID: socket.id,
        screenID: data.screenID,
        streamID: data.streamID
      });
    });
  }
}
