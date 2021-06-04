import { Request, Response } from "express";
import { HttpMethod } from "../../utils/http";

const route = {
  path: "/",
  method: HttpMethod.GET,
  routeHandler: (req: Request, res: Response) => {
    res.send("This is main route for APIs");
  },
};

export default route;
