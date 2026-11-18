export function createPollingController() {
  let stopping = false;
  let activeRequest = null;

  return {
    isStopping: () => stopping,
    startRequest: () => {
      if (stopping) return null;
      activeRequest = new AbortController();
      return activeRequest;
    },
    finishRequest: (request) => {
      if (!request || activeRequest === request) activeRequest = null;
    },
    stop: () => {
      stopping = true;
      activeRequest?.abort();
    },
  };
}

export function createShutdownController({
  server,
  abortPolling = () => {},
  stopTunnels = () => {},
  exit = (code) => process.exit(code),
  timeoutMs = 10000,
  log = () => {},
}) {
  let shutdownPromise = null;

  function shutdown(signal = 'shutdown') {
    if (shutdownPromise) return shutdownPromise;

    shutdownPromise = (async () => {
      log(`[Shutdown] Получен ${signal}, останавливаем приложение...`);
      abortPolling();
      stopTunnels();

      if (server?.listening) {
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            server.closeAllConnections?.();
            resolve();
          }, timeoutMs);
          server.close(() => {
            clearTimeout(timeout);
            resolve();
          });
          server.closeIdleConnections?.();
        });
      }
      exit(0);
    })();

    return shutdownPromise;
  }

  function install() {
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  return { shutdown, install };
}
