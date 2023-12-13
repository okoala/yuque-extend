import { MapT } from '../interfaces/i-yuque-request';
import { storage } from '@lib/hosts/storage';
import { backgrondRequestEventName } from '../constants';

export function proxyRequest(data: MapT<any>) {
  return new Promise(async (resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: backgrondRequestEventName,
        data,
      },
      res => {
        if (res.status === 200) {
          return resolve(res.data);
        }
        reject(res);
      },
    );
  });
}

export async function request(data: MapT<any>) {
  // 如果缓存
  if (data.config.cache) {
    let key;
    // 根据参数生成 key
    const keys = Object.keys(data.config.data || {});
    if (keys.length === 0) key = data.url;
    else key = JSON.stringify(data.config.data);
    let cacheData = await storage.get(key);
    let cache = cacheData ? JSON.parse(cacheData) : null;
    // 如果缓存超时了，就重新获取数据
    const now = new Date().getTime();
    if (!cache || now - cache.cachedAt > data.config.cache) {
      delete data.config.cache;
      if (!cache) cache = {};
      cache.data = await proxyRequest(data);
      cache.cachedAt = now;
      await storage.set(key, JSON.stringify(cache));
    }
    return cache.data;
  }
  return await proxyRequest(data);
}
