import { Registry, collectDefaultMetrics, register, Counter } from "prom-client";

export default class SpaceMetrics {
  sigRegistry: Registry;
  globalRegistry: Registry;
  userTrack: any;

  constructor() {
    this.sigRegistry = new Registry();
    this.userTrack = new Counter({
      name: "user_tracking",
      help: "ip, user, room, socket of a web socket connection",
      registers: [this.sigRegistry],
      labelNames: ["ip", "user", "room", "socket"]
    });

    /*new Gauge({
      name: "total_ws_users",
      help: "Number of websocket users at a point in time",
      registers: [this.sigRegistry],
      async collect() {
        const currentCounts = await space.getTotalUsers();
        this.set(currentCounts);
      },
    });*/

    /*new Gauge({
      name: "total_ws_users_each_room",
      help: "Number of websocket users in each room at a point in time",
      labelNames: ["room"],
      registers: [this.sigRegistry],
      async collect() {
        const records = await space.getUserEachRoom();
        records.map(({ room, count }) => this.set({ room: room }, count));
      },
    });*/

    collectDefaultMetrics({
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5] // These are the default buckets.
    });

    this.globalRegistry = Registry.merge([this.sigRegistry, register]);
  }

  async getMetrics() {
    return this.globalRegistry.metrics();
  }

  getContentType() {
    return this.globalRegistry.contentType;
  }
}
