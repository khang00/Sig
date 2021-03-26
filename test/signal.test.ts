import { io } from "socket.io-client";
import Server from "../src/app";

const port = 8080;
const newConnection = () => {
  return io(`http://localhost:${port}`, {
    path: "/ws",
  });
};

describe("User specifications", () => {
  const server = new Server(port);
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
