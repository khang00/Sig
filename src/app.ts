import http from "http";
import express, { Express, Request, Response } from "express";
import Signaling, { ChatRoom } from "./websocket";
import Metrics from "./metrics";
import Api from "./api";
import { Persistence } from "./persistence";
import HttpProxy from "http-proxy";

export default class Server {
  app: Express;
  api: Api;
  port: number;
  server: http.Server;
  signaling: Signaling;
  metrics: Metrics;
  proxy: HttpProxy;

  constructor(port: number, database: Persistence<ChatRoom>) {
    this.app = express();
    this.api = new Api();
    this.port = port;
    this.server = new http.Server(this.app);
    this.signaling = new Signaling(this.server, database);
    this.metrics = new Metrics(this.signaling);
    this.proxy = HttpProxy.createProxyServer();
  }

  start(onStarted: () => void) {
    this.addMetricsHandler();
    this.addProxyHandler();
    this.app.use("/api", this.api.getRoute());
    this.server.listen(this.port, onStarted);
  }

  stop(onClosed: () => void) {
    this.server.close(onClosed);
  }

  private addMetricsHandler() {
    this.app.get("/metrics", async (req: Request, res: Response) => {
      const metrics = await this.metrics.getMetrics();
      const contentType = this.metrics.getContentType();
      res.set("Content-Type", contentType).end(metrics);
    });
  }

  private addProxyHandler() {
    this.app.get("/", async (req: Request, res: Response) => {
      this.proxy.web(req, res, {target: "http://localhost:8080"},
          err => {
            console.log(err)
            res.end("Can not proxy request");
          })
    });
  }
}
