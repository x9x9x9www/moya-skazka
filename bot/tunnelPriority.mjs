// Приоритет туннелей: стабильный localtunnel важнее случайного serveo,
// а явно заданный PUBLIC_BRIDGE_URL важнее обоих.
export const TUNNEL_PRIORITY = {
  '': 0,
  serveo: 1,
  localhost_run: 2,
  localtunnel: 3,
  env: 4,
};

export function shouldActivateTunnel(source, activeSource = '') {
  return (TUNNEL_PRIORITY[source] ?? 0) >= (TUNNEL_PRIORITY[activeSource] ?? 0);
}
