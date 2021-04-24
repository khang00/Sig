import { Request, Response } from "express";
import { HttpMethod } from "../../utils/http";

const route = {
  path: "/user",
  method: HttpMethod.GET,
  routeHandler: (req: Request, res: Response) => {
    res.send("This is main route for user AIPs");
  }
};

export default route
