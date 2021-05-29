import {
  Registry,
  collectDefaultMetrics,
  register,
  Counter,
  Gauge,
} from "prom-client";
import SpaceSocket, {
  ActionTrack,
  CommunicationTrack,
  Track,
} from "./spaceSocket";
import { getCountry } from "./utils/http";

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
      labelNames: [
        "ip",
        "user",
        "room",
        "socket",
        "client",
        "timestamp",
        "country",
      ],
      async collect() {
        const usersTrackData = await Promise.all(
          signaling.getUsersTrackingData().map(async (track) => {
            return {
              ...track,
              country: await getCountry(track.ip),
            };
          })
        );

        const userOffline = trackUsers.filter(
          (track) =>
            usersTrackData.find((value) => value.socket === track.socket) ===
            undefined
        );

        trackUsers = [...usersTrackData];

        userOffline.forEach((track: any) => this.set(track, 0));
        usersTrackData.forEach((track: any) => this.set(track, 1));
      },
    });

    let trackCommunications: CommunicationTrack[] = [];
    new Gauge({
      name: "communicate_tracking",
      help: "tracks communication actions by action types, room, sender, and receiver",
      registers: [this.sigRegistry],
      labelNames: [
        "senderSocket",
        "action",
        "room",
        "sender",
        "receiver",
        "client",
      ],
      collect() {
        const commTrackData = signaling.getCommunicateTrackingData();
        const commCurrent = trackCommunications.filter(
          (track) =>
            commTrackData.find(
              (value) => value.senderSocket === track.senderSocket
            ) === undefined
        );

        trackCommunications = [...commTrackData];

        commCurrent.forEach((track: any) => this.set(track, 0));
        commTrackData.forEach((track: any) => this.set(track, 1));
      },
    });

    let trackActions: ActionTrack[] = [];
    new Gauge({
      name: "action_tracking",
      help: "tracks actions by action types, room, user",
      registers: [this.sigRegistry],
      labelNames: ["socket", "action", "room", "user", "client"],
      collect() {
        const actionTrackData = signaling.getActionTrackingData();
        const actionCurrent = trackActions.filter(
          (track) =>
            actionTrackData.find((value) => value.socket === track.socket) ===
            undefined
        );

        trackActions = [...trackActions];

        actionCurrent.forEach((track: any) => this.set(track, 0));
        actionTrackData.forEach((track: any) => this.set(track, 1));
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
