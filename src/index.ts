import Server from "./app";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

const server = new Server(port);
server.start(() =>
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
);
