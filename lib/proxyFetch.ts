import { ProxyAgent, fetch as undiciFetch } from 'undici';

const proxyAgent = new ProxyAgent('http://127.0.0.1:40000');

export async function proxyFetch(url: string, options: any = {}) {
  return undiciFetch(url, {
    ...options,
    dispatcher: proxyAgent,
  });
}