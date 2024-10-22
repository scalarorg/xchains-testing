import axios from "axios";
import { ProjectENV } from "@/env";

export async function callXchainsApi(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
) {
  const baseUrl = ProjectENV.API_URL;
  const url = `${baseUrl}/${endpoint}`;

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
