const algorithmPBKDF2 = 'PBKDF2';
const algorithmAesGcm = 'AES-GCM';

const algorithmIdPbkdf2 = {
  name: algorithmPBKDF2,
} as const satisfies AlgorithmIdentifier;

const usageDeriveKey = ['deriveKey'] as const satisfies KeyUsage[];

const pbkdf2Params = {
  name: algorithmPBKDF2,
  salt: Uint8Array.of(
    21,
    64,
    43,
    207,
    250,
    15,
    158,
    52,
    226,
    205,
    238,
    50,
    112,
    186,
    140,
    216
  ),
  iterations: 100000,
  hash: 'SHA-256',
} as const satisfies Pbkdf2Params;

const aesDerivedKeyParams = {
  name: algorithmAesGcm,
  length: 128,
} as const satisfies AesKeyAlgorithm;

// 互換のため古い方式で使っていたivを残す
const oldIv = Uint8Array.of(
  118,
  189,
  225,
  216,
  181,
  156,
  148,
  59,
  210,
  99,
  84,
  136
);

const algorithmRsaOaep = 'RSA-OAEP';

const formatForPrivate = 'pkcs8';
const formatForPublic = 'spki';

const hashSha256 = 'SHA-256';

const algorithmRsaHashedKeyGen = {
  name: algorithmRsaOaep,
  modulusLength: 2048,
  publicExponent: Uint8Array.of(1, 0, 1),
  hash: hashSha256,
} as const satisfies RsaHashedKeyGenParams;

const usageEncryptDecrypt = [
  'encrypt',
  'decrypt',
] as const satisfies KeyUsage[];
