import { Request, Response } from "express";
import { HttpMethod } from "../../utils/http";
import { FluxTableMetaData } from "@influxdata/influxdb-client";
import { queryApi } from "../DB";

const route = {
  path: "/barchart",
  method: HttpMethod.GET,
  routeHandler: (req: Request, res: Response) => {
    let rooms: any = [];
    let query;
    query = `from(bucket: "signaling") 
        |> range(start: -7d) 
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
        rooms.forEach((item: any) => {
          item.newTime = new Date(
            Number(item.timestamp) * 1000
          ).toLocaleDateString();
        });
        const counts: any = {};
        rooms.forEach((item: any) => {
          counts[item.newTime] = counts[item.newTime]
            ? counts[item.newTime] + 1
            : 1;
        });
        const dateArr = [];
        for (let i in counts) {
          const temp = {
            date: i,
            value: counts[i],
          };
          dateArr.push(temp);
        }
        res
          .status(200)
          .json(dateArr.sort((a, b) => (a.date > b.date ? 1 : -1)));
        console.log("\nFinished SUCCESS");
      },
    });
  },
};

export default route;
