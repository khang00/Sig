import http from "http";
import express, { Express, RequestHandler } from "express";
import Signaling from "./websocket";

export default class Server {
  app: Express;
  port: number;
  server: http.Server;
  signaling: Signaling;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.server = new http.Server(this.app);
    this.signaling = new Signaling(this.server);
  }

  addPathHandler(path: string, handler: RequestHandler) {
    this.app.get(path, handler);
    return this;
  }

  start(onStarted: () => void) {
    this.server.listen(this.port, onStarted);
  }

  stop(onClosed: () => void) {
    this.server.close(onClosed);
  }
}
