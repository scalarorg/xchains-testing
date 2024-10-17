import axios from "axios";
import { getNetworkConfigPath } from "@/utils/path";
import fs from "fs";
import path from "path";
import { ProjectENV } from "@/env";

interface NetworkConfig {
  [network: string]: {
    api_url: string;
  };
}

function getApiUrl(network: string): string {
  const configPath = path.join(getNetworkConfigPath(), "xchains-api.json");
  const configData = fs.readFileSync(configPath, "utf-8");
  const config: NetworkConfig = JSON.parse(configData);
  return config[network].api_url;
}

export async function callXchainsApi(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any
) {
  const baseUrl = getApiUrl(ProjectENV.NETWORK);
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await axios({
      method,
      url,
      data,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`XChains API error: ${error.message}`);
    } else {
      throw error;
    }
  }
}
