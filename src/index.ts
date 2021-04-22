import Server from "./app";
import { MemoryDB } from "./persistence";
import { SigRoom } from "./websocket";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
if (process.env.NODE === "prod") {
  const signalingDB = new MemoryDB<SigRoom>();
  const server = new Server(port, signalingDB, true);
  server.start(() =>
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`)
  );
} else {
  const signalingDB = new MemoryDB<SigRoom>();
  const server = new Server(port, signalingDB, false);
  server.start(() =>
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
  );
}
