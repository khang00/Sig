import { Server, Socket } from "socket.io";
import http from "http";
import fs from "fs";
import { instrument } from "@socket.io/admin-ui";

export interface Track {
  ip: string;
  user: string;
  room: string;
  socket: string;
  client: string;
  timestamp: string;
}

export interface CommunicationTrack {
  senderSocket: string;
  action: string;
  room: string;
  sender: string;
  receiver: string;
  client: string;
}

export interface ActionTrack {
  socket: string;
  action: string;
  room: string;
  user: string;
  client: string;
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
    this.npcData = [
      {
        id: "NPC",
        username: "Mario",
        model: "Office_Male_Business_Chr_04",
        colour: "02_B",
        x: 510,
        y: 25,
        z: -3310,
        heading: -Math.PI,
        pb: 0,
        action: "sit",
        path: []
      },
      {
        id: "NPC",
        username: "Mario",
        model: "Office_Male_Developer_Chr_01",
        colour: "01_A",
        x: 2100,
        y: 35,
        z: -2498.35,
        heading: -0.680303151066,
        pb: 0,
        action: "work",
        path: []
      },
      {
        id: "NPC",
        username: "Mario",
        model: "Office_Female_Developer_Chr_01",
        colour: "03_C",
        x: 973.97,
        y: 35,
        z: -1156.34,
        heading: -2.8429944190988,
        pb: 0,
        action: "work",
        path: []
      },
      {
        id: "NPC",
        username: "Mario",
        model: "Office_Male_Business_Chr_02",
        colour: "02_A",
        x: 498.854,
        y: 35,
        z: -1676.703,
        heading: 0.7158589446208921,
        pb: 0,
        action: "sit",
        path: [
          {
            x: 498.854,
            y: 54.24,
            z: -1676.703,
            action: "sit",
            duration: 2000,
            onStop: "sit",
            delay: 3000
          },
          {
            x: 213.196,
            y: 2.59,
            z: -1564.868,
            action: "walk",
            duration: 1000,
            onStop: "idle",
            delay: 0
          },
          {
            x: 203.541,
            y: 2.59,
            z: -494.614,
            action: "walk",
            duration: 5000,
            onStop: "point",
            delay: 5000
          },
          {
            x: 1329.19,
            y: 2.59,
            z: -646.129,
            action: "walk",
            duration: 5000,
            onStop: "idle",
            delay: 5000
          },
          {
            x: 203.541,
            y: 2.59,
            z: -494.614,
            action: "walk",
            duration: 5000,
            onStop: "point",
            delay: 5000
          },
          {
            x: 213.196,
            y: 2.59,
            z: -1564.868,
            action: "walk",
            duration: 1000,
            onStop: "idle",
            delay: 0
          },
          {
            x: 498.854,
            y: 54.24,
            z: -1676.703,
            action: "walk",
            duration: 2000,
            onStop: "sit",
            delay: 3000
          }
        ]
      },
      {
        id: "NPC",
        username: "Sonic",
        model: "Office_Female_Business_Chr_03",
        colour: "04_A",
        x: 388,
        y: 2.5,
        z: -3798,
        heading: -Math.PI,
        pb: 0, // rotaion
        action: "point",
        path: [
          // {x: -1000, y: 0, z: 10},  //start point: must same as declared npc position
          {
            x: 388,
            y: 2.5,
            z: -3798,
            action: "walk",
            duration: 3000,
            onStop: "point",
            delay: 5000
          },
          {
            x: 758.7,
            y: 2.5,
            z: -3774,
            action: "walk",
            duration: 3000,
            onStop: "cheer",
            delay: 5000
          }
        ]
      }
    ];

    this.io = new Server(server, {
      path: "/ws",
      cookie: false,
      cors: {
        origin: ["https://our3d.space", "https://3d.fromlabs.com", "http://127.0.0.1:5500"],
        credentials: false
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
          if (usersInThisRoom === undefined) usersInThisRoom = [];

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
      socket.userData = { x: 0, y: 0, z: 0, heading: 0 }; //Default values;

      socket.emit("setId", { id: socket.id, npcs: this.npcData });

      socket.on("ip", (ip: string) => {
        console.log("user ip:", ip);
        socket.userData.ip = ip;
      });

      socket.on("init", (data: any) => {
        console.log(
          `socket.init ${data.username} ${data.model}  ${data.colour}`
        );
        socket.userData.ip = socket.userData.ip
          ? socket.userData.ip
          : socket.request.connection.remoteAddress;
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
          client: socket.client.id,
          timestamp: Math.floor(Date.now() / 1000).toString(10)
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
        this.io.to(roomID).emit("onChangeFloor", {
          id: socket.id,
          floorIndex: data.floorIndex
        });
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
        console.log(
          `chat message:${socket.id} -> ${data.id} ( ${data.message} )`
        );
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
          Object.keys(this.users).forEach((roomID) => {
            this.users[roomID].forEach((sID: any) => {
              // @ts-ignore
              if (roomList[roomID] === undefined) roomList[roomID] = [];
              let soc = nsp.connected[sID];
              // @ts-ignore
              roomList[roomID].push({
                id: sID,
                data: nsp.connected[sID].userData
              });
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

      socket.on("updateIp", (ip: any) => {
        console.log(`${socket.id} has IP: ${ip}`);
      });

      socket.on("stopScreenShare", (screenID: any) => {
        console.log(`${socket.id} stop sharing screen: ${screenID}`);
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
        const usersInThisRoom = this.users[roomID].filter(
          (id: any) => id !== socket.id
        );

        socket.join(roomID);
        socket.emit("roomJoined", usersInThisRoom);
        if (this.roomScreenShare[roomID] !== undefined) {
          socket.emit("updateRoomStreams", this.roomScreenShare[roomID]);
        }

        fs.readFile("../CustomObjectData.txt", (error, txtString) => {
          if (!error) {
            let jsonString = txtString.toString();
            var data = JSON.parse(jsonString);
            if (data && data[roomID])
              socket.emit("updateCustomObjects", data[roomID]);
          }
        });

        if (this.npcData && roomID.startsWith("PK-")) {
          socket.emit("updateNPCData", this.npcData.pk);
        } else if (roomID.startsWith("CF-")) {
          socket.emit("updateNPCData", this.npcData.cf);
        }

        this.roomUpdateRequests[roomID] = true;
      });

      socket.on("sending signal", (payload: any) => {
        this.io.to(payload.userToSignal).emit("user joined", {
          signal: payload.signal,
          callerID: payload.callerID
        });
      });

      socket.on("returning signal", (payload: any) => {
        this.io.to(payload.callerID).emit("receiving returned signal", {
          signal: payload.signal,
          id: socket.id
        });
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
        if (this.roomScreenShare[roomID] === undefined)
          this.roomScreenShare[roomID] = {};
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
