import { HttpClient } from "@/utils/http-client";

export interface HttpBinResponse {
  url?: string;
  data?: string;
  json?: Record<string, string>;
}

class APIClient {
  private client = new HttpClient("https://httpbin.org");

  postTest(body: Record<string, string>): Promise<HttpBinResponse> {
    return this.client.request<HttpBinResponse>({
      url: "/post",
      method: "POST",
      data: body,
    });
  }
}

export const apiClient = new APIClient();
