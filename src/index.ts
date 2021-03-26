import express from "express";
import http from "http";
import Signaling from "./websocket";

const app = express();
const server = http.createServer(app);
new Signaling(server);
const port = process.env.PORT || 8080;

app.get("/", (req, res) => res.send("Express + TypeScript Server"));

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
