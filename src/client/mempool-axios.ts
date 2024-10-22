import axios, { AxiosInstance } from "axios";
import { ProjectENV } from "@/env";
import { FeesRecommended } from "@mempool/mempool.js/lib/interfaces/bitcoin/fees";
import { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";

export class MempoolAxiosClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL =
      ProjectENV.MEMPOOL_WEB +
      (ProjectENV.NETWORK === "testnet" ? "/testnet" : "");
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  async callMempoolApi(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any
  ) {
    try {
      const response = await this.axiosInstance({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Mempool API error: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  async getFeesRecommended(): Promise<FeesRecommended> {
    return this.callMempoolApi("/api/v1/fees/recommended");
  }

  async getAddressTxsUtxo(address: string): Promise<AddressTxsUtxo[]> {
    return this.callMempoolApi(`/api/address/${address}/utxo`);
  }
}

// Singleton instance
let mempoolAxiosClient: MempoolAxiosClient;

export const getMempoolAxiosClient = () => {
  if (!mempoolAxiosClient) {
    mempoolAxiosClient = new MempoolAxiosClient();
  }
  return mempoolAxiosClient;
};
