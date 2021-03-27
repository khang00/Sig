import Server from "./app";
import { MemoryDB } from "./persistence";
import { ChatRoom } from "./websocket";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const signalingDB = new MemoryDB<ChatRoom>();
const server = new Server(port, signalingDB);
server.start(() =>
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
);
