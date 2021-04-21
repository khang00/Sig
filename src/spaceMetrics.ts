import { Registry, collectDefaultMetrics, register, Counter, Gauge } from "prom-client";
import SpaceSocket, { Track } from "./spaceSocket";

interface Buckets {
  left: Track[]
  right: Track[]
}

export default class SpaceMetrics {
  sigRegistry: Registry;
  globalRegistry: Registry;
  userTrack: any;

  constructor(signaling: SpaceSocket) {
    let trackUsers = new Map<string, Track>();
    this.sigRegistry = new Registry();
    this.userTrack = new Gauge({
      name: "user_tracking",
      help: "ip, user, room, socket of a web socket connection",
      registers: [this.sigRegistry],
      labelNames: ["ip", "user", "room", "socket"],
      collect() {
        const usersTrackData = signaling.getUsersTrackingData();
        const userBuckets = usersTrackData.reduce((buckets: Buckets, record: Track) => {
          if (trackUsers.has(record.socket)) {
            return { left: buckets.left, right: [...buckets.right, record] };
          } else {
            return { left: [...buckets.left, record], right: buckets.right };
          }
        }, { left: [], right: [] });

        trackUsers = usersTrackData.reduce((acc, track) =>
          acc.set(track.socket, track), new Map<string, Track>());
        console.log(userBuckets.left, userBuckets.right)
        userBuckets.left.forEach((track: any) => this.set(track, 0));
        userBuckets.right.forEach((track: any) => this.set(track, 1));
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
