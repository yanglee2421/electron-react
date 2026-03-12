export interface Net {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}
