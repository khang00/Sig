import fetch from "node-fetch";

export enum HttpMethod {
  GET = "get",
  POST = "post",
}

export const getCountry = async (ip: string): Promise<string> => {
  const response = await fetch(
    `https://api.ipgeolocation.io/ipgeo?apiKey=59c7d79861e54a219056fc6c7e7b67f1&ip=${ip}`
  );
  return (await response.json()).country_name;
};
