async function encrypt(value: ArrayBuffer | ArrayBufferView) {
  return crypto.subtle.encrypt(algorismWithIv, await keyPromise, value);
}
