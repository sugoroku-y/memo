async function exportKey(key: CryptoKey) {
  return encodeBase64(await crypto.subtle.exportKey('raw', key));
}

async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  return encodeBase64(
    await crypto.subtle.exportKey(formatForPrivate, privateKey)
  );
}

async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  return encodeBase64(
    await crypto.subtle.exportKey(formatForPublic, publicKey)
  );
}

async function exportKeyPair(keyPair: CryptoKeyPair): Promise<string> {
  const keys = await Promise.all([
    exportPrivateKey(keyPair.privateKey),
    exportPublicKey(keyPair.publicKey),
  ]);
  return keys.join('!');
}
