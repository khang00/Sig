import { Registry, collectDefaultMetrics, register, Counter, Gauge } from "prom-client";
import SpaceSocket, { ActionTrack, Track } from "./spaceSocket";

export default class SpaceMetrics {
  sigRegistry: Registry;
  globalRegistry: Registry;

  constructor(signaling: SpaceSocket) {
    this.sigRegistry = new Registry();

    let trackUsers: Track[] = [];
    new Gauge({
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

    let trackActions: ActionTrack[] = [];
    new Gauge({
      name: "communicate_tracking",
      help: "tracks communication actions by action types, room, sender, and receiver",
      registers: [this.sigRegistry],
      labelNames: ["senderSocket", "action", "room", "sender", "receiver"],
      collect() {
        const commTrackData = signaling.getCommunicateTrackingData();
        const commCurrent = trackActions.filter(track => commTrackData
          .find(value => value.senderSocket === track.senderSocket) === undefined);

        trackActions = [...commTrackData];

        commCurrent.forEach((track: any) => this.set(track, 0));
        commTrackData.forEach((track: any) => this.set(track, 1));
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
