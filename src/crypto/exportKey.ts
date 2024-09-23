async function exportKey(key: CryptoKey) {
  return encodeBase64(await crypto.subtle.exportKey('raw', key));
}
