import http from "http";
import express, { Express, Request, Response } from "express";
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
    this.port = port
  }

  start(onStarted: () => void) {
    this.app.use("/api", (req :Request, resp :Response) => {
      resp.status(200).end("halo")
    });
    this.server.listen(this.port, onStarted)
  }

  stop(onClosed: () => void) {
    this.server.close(onClosed);
  }
}
