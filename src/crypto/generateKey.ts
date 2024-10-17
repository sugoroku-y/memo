async function generateKey(password: string) {
  const rawPassword = new TextEncoder().encode(password);
  const importedPassword = await crypto.subtle.importKey(
    'raw',
    rawPassword,
    algorithmIdPbkdf2,
    false,
    usageDeriveKey
  );
  return await crypto.subtle.deriveKey(
    pbkdf2Params,
    importedPassword,
    aesDerivedKeyParams,
    true,
    usageEncryptDecrypt
  );
}

function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    algorithmRsaHashedKeyGen,
    true,
    usageEncryptDecrypt
  );
}
