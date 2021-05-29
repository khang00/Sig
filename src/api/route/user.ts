import { Request, Response } from "express";
import { HttpMethod } from "../../utils/http";
import { FluxTableMetaData } from "@influxdata/influxdb-client";
import { queryApi } from "../DB";

const route = {
  path: "/user",
  method: HttpMethod.GET,
  routeHandler: (req: Request, res: Response) => {
    const reqQuery = req.query;
    console.log("request query", reqQuery);
    let rooms: any = [];
    let query;
    query = `from(bucket: "signaling") 
        |> range(start: ${reqQuery.from ? reqQuery.from : "-30d"}${reqQuery.to ? ', stop:' + reqQuery.to : ''}) 
        |> filter(fn: (r) => r._measurement == "prometheus" and r._field == "user_tracking")
        |> distinct(column: "user")
        `;

    queryApi.queryRows(query, {
      next(row: string[], tableMeta: FluxTableMetaData) {
        let data = tableMeta.toObject(row);
        rooms.push(data);
      },
      error(error: Error) {
        console.error(error);
        console.log("\nFinished ERROR");
        res.status(500).json(error);
      },
      complete() {
        res.status(200).json(rooms);
        console.log("\nFinished SUCCESS");
      },
    });
  },
};

export default route;
