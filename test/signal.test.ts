import { io } from "socket.io-client";
import Server from "../src/app";
import { MemoryDB } from "../src/persistence";
import { ChatRoom } from "../src/websocket";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const newConnection = () => {
  return io(`http://localhost:${port}`, {
    path: "/ws",
  }).on("connect_error", (err) => console.log(err));
};

describe("User specifications", () => {
  const mockDB = new MemoryDB<ChatRoom>();
  const server = new Server(port, mockDB);
  beforeAll((done) => {
    server.start(() => {
      console.log("start server");
      done();
    });
  });

  afterAll((done) => {
    server.stop(() => {
      console.log("close server");
      done();
    });
  });

  test("connection should work", (done) => {
    const connection = newConnection();
    connection.on("connection", (data) => {
      connection.close();
      done();
    });
  });

  test("user can login", (done) => {
    const alice = newConnection();
    alice.on("connection", () => {
      alice.emit("login", "alice");
      alice.close();
      done();
    });
  });
});
