import { Request, Response } from "express";
import { HttpMethod } from "../../utils/http";
import fs from "fs";
const route = {
  path: "/change-password",
  method: HttpMethod.POST,
  routeHandler: (req: Request, res: Response) => {
    var bcrypt = require("bcryptjs");

    //read json file

    const readData = fs.readFileSync("./user.json", "utf8");
    const userStored = JSON.parse(readData);
    let checked = bcrypt.compareSync(
      req.body.current_password,
      userStored.password
    ); // false
    if (checked) {
      let userCredential = {
        username: "admin",
        password: bcrypt.hashSync(req.body.new_password, 10),
      };
      // convert JSON object to a string
      const data = JSON.stringify(userCredential);

      // write file to disk
      fs.writeFile("./user.json", data, "utf8", (err: any) => {
        if (err) {
          console.log(`Error writing file: ${err}`);
        } else {
          res
            .status(200)
            .json({ code: 200, message: "Change password successfully" });

          console.log(`File is written successfully!`);
        }
      });
    } else {
      res
        .status(200)
        .json({
          code: 404,
          message: "Wrong current password .Fail to change password",
        });
    }
  },
};

export default route;
