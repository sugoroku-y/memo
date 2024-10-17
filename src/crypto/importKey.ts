async function importKey(saved: string) {
  return crypto.subtle.importKey(
    'raw',
    decodeBase64(saved),
    aesDerivedKeyParams,
    false,
    usageEncryptDecrypt
  );
}

async function importPrivateKey(exported: string): Promise<CryptoKey> {
  const keyData = decodeBase64(exported);
  try {
    return await crypto.subtle.importKey(
      formatForPrivate,
      keyData,
      algorithmRsaHashedKeyGen,
      false,
      ['decrypt']
    );
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}

async function importPublicKey(exported: string): Promise<CryptoKey> {
  const keyData = decodeBase64(exported);
  try {
    return await crypto.subtle.importKey(
      formatForPublic,
      keyData,
      algorithmRsaHashedKeyGen,
      false,
      ['encrypt']
    );
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}

async function importKeyPair(exported: string): Promise<CryptoKeyPair> {
  const [privateExported, publicExported] = exported.split('!');
  const [publicKey, privateKey] = await Promise.all([
    importPublicKey(publicExported),
    importPrivateKey(privateExported),
  ]);
  return {publicKey, privateKey};
}
