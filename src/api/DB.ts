const { InfluxDB } = require("@influxdata/influxdb-client");

// You can generate a Token from the "Tokens Tab" in the UI
const token =
  "Zwx4X-vchs7NCZxKPKJYOxZIpRErZsfx6xrax_4dbJ1ae7rvR8wVn_UxH8GGQZaYtJzORpjZl6nlVG6zUen3Pg==";
const org = "ITEC.HCMUS";
const bucket = "signaling";

const client = new InfluxDB({
  url: "http://rtc-test.fromlabs.com:8086",
  token: token,
});
const writeApi = client.getWriteApi(org, bucket);
const queryApi = client.getQueryApi(org);

export { writeApi, queryApi };
