import { Registry, collectDefaultMetrics, register, Counter, Gauge } from "prom-client";
import SpaceSocket, { Track } from "./spaceSocket";

export default class SpaceMetrics {
  sigRegistry: Registry;
  globalRegistry: Registry;
  userTrack: any;

  constructor(signaling: SpaceSocket) {
    let trackUsers: Track[] = [];
    this.sigRegistry = new Registry();
    this.userTrack = new Gauge({
      name: "user_tracking",
      help: "ip, user, room, socket of a web socket connection",
      registers: [this.sigRegistry],
      labelNames: ["ip", "user", "room", "socket"],
      collect() {
        const usersTrackData = signaling.getUsersTrackingData();
        const userOffline = trackUsers.filter(track => usersTrackData
          .find(value => value.socket === track.socket) === undefined);

        trackUsers = [...usersTrackData];

        userOffline.forEach((track: any) => this.set(track, 0));
        usersTrackData.forEach((track: any) => this.set(track, 1));
      }
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
