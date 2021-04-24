import express, { Request, Response, Router } from "express";
import { HttpMethod } from "../utils/http";
import glob from "glob";

const loadRoute = (onRoutesLoaded: (route: Route[]) => void) => {
  const promises = glob.sync(`./src/api/route/*`)
    .map((file) => {
      const fileName = file.split("/").slice(-1)[0].split(".")[0];
      return import(`./route/${fileName}`);
    });

  Promise.all(promises).then(modules => onRoutesLoaded(modules
    .map((module) => module.default)));
};

export class Api {
  private readonly router: express.Router;

  constructor() {
    this.router = express.Router();
  }

  onRouteLoaded = (router: Router, onRouter: (router: Router) => void) => (routes: Route[]) => {
    onRouter(routes.reduce((acc, route) =>
        router[route.method](route.path, route.routeHandler),
      router));
  };

  onRouter(onCreated: (router: Router) => void) {
    loadRoute(this.onRouteLoaded(this.router, onCreated));
  }
}

interface Route {
  path: string
  method: HttpMethod

  routeHandler(req: Request, res: Response): void
}
