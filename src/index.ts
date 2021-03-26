import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;

app.get("/", (req, res) => res.send("Express + TypeScript Server"));

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
