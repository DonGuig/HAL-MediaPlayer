// Uses fetch but implements custom error handling

import globalSnackbar from "./snackbarUtils";
import { SERVER_URL } from "src/ServerURL";

const baseApiURL: string = `http://${SERVER_URL}/api`;

interface RequestParams {
    data? : any
    silent? : boolean;
    timeoutMs? : number;
}

// True if the server couldn't be reached, as opposed to the server answering with an error
export const isConnectionError = (error: unknown): boolean =>
  error instanceof TypeError || (error as Error)?.name === "TimeoutError";

class HttpApiRequests {
  static async get<T>(url: string, params?: RequestParams): Promise<T> {
    const urlAPI = baseApiURL + url;
    try {
      const requestParams = {
          signal: AbortSignal.timeout(4000), // 4 seconds timeout
        };
      const response = await fetch(urlAPI, requestParams);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unknown error");
      }
      const text = await response.text();
      if (!text) {
        return undefined;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      this.handleError(error, params?.silent);
      throw error; // Re-throw the error after handling
    }
  }

  static async post<T>(url: string, params?: RequestParams): Promise<T> {
    try {
      const urlAPI = baseApiURL + url;
      let requestParams: RequestInit;
      if (params?.data) {
        requestParams = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params.data),
          signal: AbortSignal.timeout(params.timeoutMs ?? 4000), // 4 seconds by default
        };
      } else {
        requestParams = {
          method: "POST",
        };
      }
      const response = await fetch(urlAPI, requestParams);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unknown error");
      }
      const text = await response.text();
      if (!text) {
        return undefined;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      this.handleError(error, params?.silent);
      throw error; // Re-throw the error after handling
    }
  }

  private static handleError(error: any, silent?:boolean): void {
    if (silent){
        return;
    }
    if (error instanceof Error) {
      globalSnackbar.error(error.message);
    } else {
      globalSnackbar.error("Unknown error occurred during HTTP request.");
    }
  }
}

export default HttpApiRequests;

