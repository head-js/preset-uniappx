export class HttpClient {
  constructor(private readonly baseURL: string) {}

  async request<T>(options: UniNamespace.RequestOptions): Promise<T> {
    try {
      const res = await uni.request({
        ...options,
        url: this.baseURL + options.url,
      });
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error(`request failed: status ${res.statusCode}`);
      }
      return res.data as T;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error((error as { errMsg?: string }).errMsg ?? "request failed");
    }
  }
}
