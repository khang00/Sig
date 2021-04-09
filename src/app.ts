import http from "http";
import https from "https";
import express, { Express, Request, Response } from "express";
import { ChatRoom } from "./websocket";
import Api from "./api";
import { Persistence } from "./persistence";
import HttpProxy from "http-proxy";
// @ts-ignore
import HttpProxyRules from "http-proxy-rules";
import * as fs from "fs";
import SpaceSocket from "./spaceSocket";
import SpaceMetrics from "./spaceMetrics";

export default class Server {
  app: Express;
  api: Api;
  port: number;
  server: http.Server;
  signaling: SpaceSocket;
  metrics: SpaceMetrics;
  proxy: HttpProxy;
  proxyRules: any;

  constructor(port: number, database: Persistence<ChatRoom>, secure = false) {
    this.app = express();
    this.api = new Api();
    this.server = this.createServer(this.app, secure);
    this.port = port;
    this.metrics = new SpaceMetrics();
    this.signaling = new SpaceSocket(this.server, this.metrics);
    this.proxy = HttpProxy.createServer();
    this.proxyRules = new HttpProxyRules({
      rules: {
        "/*": "http://localhost:8000",
        "/api/*": "http://localhost:8080/api"
      },
      default: "http://localhost:8080"
    });
  }

  createServer(app: Express, secure: boolean): http.Server {
    if (secure) {
      const privateKey = fs.readFileSync("secret/key_from.pem");
      const certificate = fs.readFileSync("secret/cert_from.pem");
      const credentials = { key: privateKey, cert: certificate };
      return new https.Server(credentials, app);
    } else {
      return new http.Server(app);
    }
  }

  start(onStarted: () => void) {
    this.addMetricsHandler();
    // this.app.use("/api", this.api.getRoute());
    this.addProxyHandler();
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
    this.app.get("/*", async (req: Request, res: Response) => {
      const target = this.proxyRules.match(req);
      this.proxy.web(req, res, { target }, (err) => {
        console.error(err);
        res.end("Can not proxy request");
      });
    });
  }
}
