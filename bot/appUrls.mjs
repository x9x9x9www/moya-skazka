export function buildAppUrlWithApi({
  webAppBaseUrl,
  apiUrl,
  isAdmin = false,
  skipTunnels = false,
  publicBridgeUrl = '',
  publicTunnelUrl = '',
}) {
  const base = webAppBaseUrl;
  const configuredBridge = (publicBridgeUrl || '').replace(/\/+$/, '');
  const target = skipTunnels ? configuredBridge : apiUrl || publicTunnelUrl || configuredBridge;
  let url = target ? `${base}${base.includes('?') ? '&' : '?'}api_url=${encodeURIComponent(target)}` : base;
  if (isAdmin) {
    url += `${url.includes('?') ? '&' : '?'}admin=1`;
  }
  return url;
}
