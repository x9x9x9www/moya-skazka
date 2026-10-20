// Приоритет туннелей: стабильный localtunnel важнее случайного serveo,
// а явно заданный PUBLIC_BRIDGE_URL важнее обоих.
export const TUNNEL_PRIORITY = {
  '': 0,
  serveo: 1,
  localtunnel: 2,
  env: 3,
};

export function shouldActivateTunnel(source, activeSource = '') {
  return (TUNNEL_PRIORITY[source] ?? 0) >= (TUNNEL_PRIORITY[activeSource] ?? 0);
}
