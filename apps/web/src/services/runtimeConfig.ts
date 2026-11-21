export function isSameOriginApi(): boolean {
  return (import.meta as any).env?.VITE_API_SAME_ORIGIN === 'true';
}
