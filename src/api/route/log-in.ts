import { Request, Response } from "express";
import { HttpMethod } from "../../utils/http";
import fs from "fs";
const route = {
  path: "/log-in",
  method: HttpMethod.POST,
  routeHandler: (req: Request, res: Response) => {
    var bcrypt = require("bcryptjs");

    const readData = fs.readFileSync("./user.json", "utf8");
    const userStored = JSON.parse(readData);
    let checked = bcrypt.compareSync(req.body.password, userStored.password); // false
    if (checked && req.body.username === userStored.username) {
      res.status(200).json({ code: 200, message: "Log in successfully" });
    } else {
      res.status(200).json({ code: 404, message: "Invalid credential" });
    }
  },
};

export default route;
