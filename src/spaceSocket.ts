import { Server, Socket } from "socket.io";
import http from "http";
import fs from "fs";
import SpaceMetrics from "./spaceMetrics";
import { instrument } from "@socket.io/admin-ui";

export interface Track {
  ip: string,
  user: string,
  room: string,
  socket: string,
  client: string
}

export interface CommunicationTrack {
  senderSocket: string
  action: string,
  room: string,
  sender: string,
  receiver: string,
  client: string
}

export interface ActionTrack {
  socket: string,
  action: string,
  room: string,
  user: string,
  client: string
}

export default class SpaceSocket {
  io: Server;
  users: any;
  socketToRoom: any;
  roomUpdateRequests: any;
  roomScreenShare: any;
  npcData: any;
  usersTrackingData: Map<string, Track>;
  commTrackingData: Map<string, CommunicationTrack>;
  actionTrackingData: Map<string, ActionTrack>;

  constructor(server: http.Server) {
    this.users = {};
    this.usersTrackingData = new Map<string, Track>();
    this.commTrackingData = new Map<string, CommunicationTrack>();
    this.actionTrackingData = new Map<string, ActionTrack>();
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

    instrument(this.io, {
      auth: false
    });

    setInterval(() => {
      const nsp = this.io.of("/");
      for (const roomID in this.roomUpdateRequests) {
        if (this.roomUpdateRequests[roomID]) {
          this.roomUpdateRequests[roomID] = false;
          let usersInThisRoom = this.users[roomID];
          if (usersInThisRoom === undefined)
            usersInThisRoom = [];

          let pack = [];
          for (let sId of usersInThisRoom) {
            const socket = nsp.sockets.get(sId);
            // @ts-ignore
            if (socket !== undefined && socket.userData.model !== undefined) {
              pack.push({
                id: socket.id,
                // @ts-ignore
                username: socket.userData.username,
                // @ts-ignore
                model: socket.userData.model,
                // @ts-ignore
                colour: socket.userData.colour,
                // @ts-ignore
                x: socket.userData.x,
                // @ts-ignore
                y: socket.userData.y,
                // @ts-ignore
                z: socket.userData.z,
                // @ts-ignore
                heading: socket.userData.heading,
                // @ts-ignore
                pb: socket.userData.pb,
                // @ts-ignore
                action: socket.userData.action,
                // @ts-ignore
                headX: socket.userData.headX,
                // @ts-ignore
                headY: socket.userData.headY
              });
            }
          }

          if (pack.length > 0) this.io.to(roomID).emit("remoteData", pack);
        }
      }
    }, 1000 / 40);

    // first invariant: join room event happens before init
    this.io.on("connection", (socket: Socket | any) => {
      socket.userData = { x: 0, y: 0, z: 0, heading: 0 };//Default values;

      socket.emit("setId", { id: socket.id, npcs: this.npcData });

      socket.on("ip", (ip: string) => {
        console.log("user ip:", ip);
        socket.userData.ip = ip;
      });

      socket.on("init", (data: any) => {
        console.log(`socket.init ${data.username} ${data.model}  ${data.colour}`);
        socket.userData.ip = socket.userData.ip ? socket.userData.ip : socket.request.connection.remoteAddress;
        socket.userData.username = data.username;
        socket.userData.model = data.model;
        socket.userData.colour = data.colour;
        socket.userData.x = data.x;
        socket.userData.y = data.y;
        socket.userData.z = data.z;
        socket.userData.heading = data.h;
        socket.userData.pb = data.pb;
        socket.userData.action = "idle";

        const userTrack: Track = {
          ip: socket.userData.ip,
          user: socket.userData.username,
          room: socket.userData.room,
          socket: socket.id,
          client: socket.client.id
        };

        this.usersTrackingData.set(socket.id, userTrack);

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
        this.actionTrackingData.set(socket.id, {
          socket: socket.id,
          action: "change floor",
          room: socket.userData.room,
          user: socket.userData.username,
          client: socket.client.id
        });
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
        const receiver = this.usersTrackingData.get(data.id);
        this.commTrackingData.set(socket.id, {
          senderSocket: socket.id,
          room: socket.userData.room,
          action: "message",
          sender: socket.userData.username,
          client: socket.client.id,
          receiver: receiver ? receiver.user : ""
        });
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
          socket.userData.room = roomID;
          socket.userData.joinRoomTime = Math.floor(Date.now() / 1000);
        }

        if (this.users.hasOwnProperty(roomID)) {
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
        if (!this.usersTrackingData.delete(socket.id)) {
          console.log("delete socket failed", socket.id);
        }

        this.roomUpdateRequests[roomID] = true;
      });

      socket.on("share screen", (data: any) => {
        let roomID = this.socketToRoom[socket.id];
        if (this.roomScreenShare[roomID] === undefined) this.roomScreenShare[roomID] = {};
        this.roomScreenShare[roomID][data.screenID] = data.streamID;
        this.commTrackingData.set(socket.id, {
          action: "share_screen",
          room: socket.userData.room,
          senderSocket: socket.id,
          sender: socket.userData.username,
          client: socket.client.id,
          receiver: ""
        });
        this.io.to(roomID).emit("share screen", {
          callerID: socket.id,
          screenID: data.screenID,
          streamID: data.streamID
        });
      });
    });
  }

  getUsersTrackingData(): Track[] {
    return Array.from(this.usersTrackingData.values());
  }

  getCommunicateTrackingData(): CommunicationTrack[] {
    return Array.from(this.commTrackingData.values());
  }

  getActionTrackingData(): ActionTrack[] {
    return Array.from(this.actionTrackingData.values());
  }
}
