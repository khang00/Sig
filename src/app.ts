import http from "http";
import express, { Express, Request, RequestHandler, Response } from "express";
import Signaling from "./websocket";
import Metrics from "./metrics";
import Api from "./api";

export default class Server {
  app: Express;
  api :Api;
  port: number;
  server: http.Server;
  signaling: Signaling;
  metrics: Metrics;

  constructor(port: number) {
    this.app = express();
    this.api = new Api();
    this.port = port;
    this.server = new http.Server(this.app);
    this.signaling = new Signaling(this.server);
    this.metrics = new Metrics(this.signaling);
  }

  private addMetricsHandler() {
    this.app.get("/metrics", async (req: Request, res: Response) => {
      const metrics = await this.metrics.getMetrics();
      const contentType = this.metrics.getContentType();
      res.set("Content-Type", contentType)
        .end(metrics);
    });
  }

  start(onStarted: () => void) {
    this.addMetricsHandler()
    this.app.use("/api", this.api.getRoute())
    this.server.listen(this.port, onStarted);
  }

  stop(onClosed: () => void) {
    this.server.close(onClosed);
  }
}
