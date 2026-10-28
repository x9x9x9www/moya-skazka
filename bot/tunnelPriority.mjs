// Приоритет туннелей: Pinggy (надежный TCP на 443 без 502) > localtunnel > serveo,
// а явно заданный PUBLIC_BRIDGE_URL важнее всех.
export const TUNNEL_PRIORITY = {
  '': 0,
  localhost_run: 1,
  localtunnel: 2,
  pinggy: 3,
  serveo: 4,
  cloudflare: 5,
  env: 6,
};

export function shouldActivateTunnel(source, activeSource = '') {
  return (TUNNEL_PRIORITY[source] ?? 0) >= (TUNNEL_PRIORITY[activeSource] ?? 0);
}
