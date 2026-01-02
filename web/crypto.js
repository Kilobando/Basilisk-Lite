const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function generateIdentity() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return {
    publicKey: toBase64(JSON.stringify(publicKey)),
    privateKey: toBase64(JSON.stringify(privateKey)),
  };
}

export async function importIdentity(privateKeyBase64, publicKeyBase64) {
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(fromBase64(privateKeyBase64)),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(fromBase64(publicKeyBase64)),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
  return { privateKey, publicKey };
}

export async function importPublicKey(publicKeyBase64) {
  return crypto.subtle.importKey(
    "jwk",
    JSON.parse(fromBase64(publicKeyBase64)),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

export async function deriveSharedKey(privateKey, peerPublicKey) {
  return crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: peerPublicKey,
    },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(sharedKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = encoder.encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    data
  );
  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
  };
}

export async function decryptMessage(sharedKey, cipher, iv) {
  const buffer = fromBase64ToBuffer(cipher);
  const ivBytes = fromBase64ToBuffer(iv);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    sharedKey,
    buffer
  );
  return decoder.decode(plaintext);
}

export function toBase64(data) {
  let bytes;
  if (typeof data === "string") {
    bytes = encoder.encode(data);
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else if (ArrayBuffer.isView(data)) {
    bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  } else {
    throw new Error("Unsupported data type for base64 encoding");
  }
  return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function fromBase64ToBuffer(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
