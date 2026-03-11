import { webcrypto } from "node:crypto";

type PkceCodeChallengeMethodType = "plain" | "S256";

export type PkcePairType = {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: PkceCodeChallengeMethodType;
};

export async function generateRandomString(
  length: number = 43,
): Promise<string> {
  const crypto = await getCryptoInstance();
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  let result = "";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));

  for (const value of randomValues) {
    result += characters[value % characters.length];
  }

  return result;
}

export async function getCryptoInstance(): Promise<Crypto> {
  if (typeof globalThis.crypto !== "undefined") {
    return globalThis.crypto;
  }

  return webcrypto as Crypto;
}

export async function generatePkcePair(
  length: number = 43,
  method: PkceCodeChallengeMethodType,
): Promise<PkcePairType> {
  const codeVerifier = await generatePkceCodeVerifier(length);
  const codeChallenge = await generatePkceCodeChallenge(codeVerifier, method);

  return { codeVerifier, codeChallenge, codeChallengeMethod: method };
}

export async function generatePkceCodeVerifier(
  length: number = 43,
): Promise<string> {
  return await generateRandomString(length);
}

export async function generatePkceCodeChallenge(
  codeVerifier: string,
  method: PkceCodeChallengeMethodType,
): Promise<string> {
  if (method === "plain") {
    return codeVerifier;
  }
  if (method !== "S256") {
    throw new Error(`PKCE Only support plain or S256 method !`);
  }

  const crypto = await getCryptoInstance();
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function verifyPkceCode(
  codeVerifier: string,
  codeChallenge: string,
  method: PkceCodeChallengeMethodType = "S256",
): Promise<boolean> {
  const compare = await generatePkceCodeChallenge(codeVerifier, method);

  return codeChallenge === compare;
}
