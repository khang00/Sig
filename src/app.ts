import http from "http";
import express, { Express } from "express";
import { Api } from "./api";

const CORS_OPTION = {
  origin: "http://localhost"
};

export default class Server {
  app: Express;
  port: number;
  server: http.Server;
  api: Api;

  constructor(port: number) {
    this.app = express();
    this.api = new Api();
    this.server = new http.Server(this.app);
    this.port = port;
    this.api.onRouter(router => this.app.use("/api", router));
  }

  start(onStarted: () => void) {
    this.server.listen(this.port, onStarted);
  }

  stop(onClosed: () => void) {
    this.server.close(onClosed);
  }
}
