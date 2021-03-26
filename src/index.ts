import { Request, Response } from "express";
import Server from "./app";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080
const server = new Server(port);
const main = (req: Request, res: Response) => res.send("Express + TypeScript Server");
server.addPathHandler("/", main);
server.start(() => console.log(`⚡️[server]: Server is running at http://localhost:${port}`))
