import fetch from "node-fetch";

export enum HttpMethod {
  GET = "get",
  POST = "post",
}

export const getCountry = async (ip: string): Promise<string> => {
  const response = await fetch(
    `https://api.ipgeolocation.io/ipgeo?apiKey=4da1f1a06ce6487391e7c20f7eea8ce6&ip=${ip}`
  );
  return (await response.json()).country_name;
};
