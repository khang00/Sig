import http from "http";
import express, { Express, RequestHandler } from "express";
import Signaling from "./websocket";

export default class Server {
  app :Express
  port:number
  server:http.Server
  signaling:Signaling

  constructor(port :number) {
    this.app = express();
    this.port = port;
    this.server = http.createServer(this.app);
    this.signaling = new Signaling(this.server)
  }

  addPathHandler(path :string, handler :RequestHandler) {
    this.app.get(path, handler);
    return this
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${this.port}`);
    });
  }

  stop() {
    this.server.close()
  }
}
