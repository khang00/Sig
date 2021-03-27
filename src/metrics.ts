import { Registry, Gauge, collectDefaultMetrics, register } from "prom-client";
import Signaling from "./websocket";

export default class Metrics {
  sigRegistry: Registry;
  globalRegistry: Registry;

  constructor(signaling: Signaling) {
    this.sigRegistry = new Registry();

    new Gauge({
      name: "total_ws_users",
      help: "Number of websocket users at a point in time",
      registers: [this.sigRegistry],
      async collect() {
        const currentCounts = await signaling.getTotalUsers();
        this.set(currentCounts);
      },
    });

    new Gauge({
      name: "total_ws_users_each_room",
      help: "Number of websocket users in each room at a point in time",
      labelNames: ["room"],
      registers: [this.sigRegistry],
      async collect() {
        const records = await signaling.getUserEachRoom();
        records.map(({ room, count }) => this.set({ room: room }, count));
      },
    });

    collectDefaultMetrics({
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // These are the default buckets.
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
