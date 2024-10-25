const keyPromise = (async () => {
  await new Promise<void>(resolve =>
    window.addEventListener('DOMContentLoaded', () => resolve())
  );
  return await configuration.loadCryptoKey();
})();
