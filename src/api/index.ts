import express from "express";

export default class Api {
  private readonly router: express.Router;

  constructor() {
    this.router = express.Router();
  }

  getRoute() {
    return this.router;
  }
}
