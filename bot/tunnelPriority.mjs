// Приоритет туннелей: Pinggy (надежный TCP на 443 без 502) > localtunnel > serveo,
// а явно заданный PUBLIC_BRIDGE_URL важнее всех.
export const TUNNEL_PRIORITY = {
  '': 0,
  serveo: 1,
  localhost_run: 2,
  localtunnel: 3,
  pinggy: 4,
  cloudflare: 5,
  env: 6,
};

export function shouldActivateTunnel(source, activeSource = '') {
  return (TUNNEL_PRIORITY[source] ?? 0) >= (TUNNEL_PRIORITY[activeSource] ?? 0);
}
