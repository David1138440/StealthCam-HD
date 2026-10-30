// Helper functions to convert between ArrayBuffer and Base64URL for WebAuthn serialization
export function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function base64URLToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Checks if the WebAuthn API is supported in this browser context,
 * and whether a platform authenticator (fingerprint, facial recognition) is available.
 */
export async function isWebAuthnSupported(): Promise<boolean> {
  try {
    if (
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
    ) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (e) {
    console.warn("Error verifying platform authenticator availability:", e);
  }
  return false;
}

export interface RegisterCredentialOptions {
  username: string;
  displayName: string;
}

/**
 * Invokes standard WebAuthn API to register a new platform-level biometric credential.
 */
export async function registerBiometric(options: RegisterCredentialOptions) {
  if (!window.PublicKeyCredential) {
    throw new Error("Su navegador no soporta la API de Web Authentication (WebAuthn).");
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const creationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: "StealthCam HD Surveillance",
      id: window.location.hostname || "localhost",
    },
    user: {
      id: userId,
      name: options.username,
      displayName: options.displayName,
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256 (ECDSA P-256 with SHA-256)
      { type: "public-key", alg: -257 }, // RS256 (RSA Signature with SHA-256)
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Enforces platform scanner (e.g. Touch ID, Face ID, Windows Hello)
      userVerification: "required",
    },
    timeout: 60000,
  };

  const credential = await navigator.credentials.create({
    publicKey: creationOptions,
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error("El sistema biométrico del dispositivo canceló el registro.");
  }

  return {
    id: credential.id,
    rawId: bufferToBase64URL(credential.rawId),
    type: credential.type,
  };
}

/**
 * Invokes standard WebAuthn API to verify/authenticate a registered credential.
 */
export async function authenticateBiometric(storedRawId: string) {
  if (!window.PublicKeyCredential) {
    throw new Error("La autenticación biométrica de hardware no está disponible en este navegador.");
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const credentialId = base64URLToBuffer(storedRawId);

  const assertionOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: window.location.hostname || "localhost",
    allowCredentials: [
      {
        type: "public-key",
        id: credentialId,
      },
    ],
    userVerification: "required",
    timeout: 60000,
  };

  const assertion = await navigator.credentials.get({
    publicKey: assertionOptions,
  }) as PublicKeyCredential;

  if (!assertion) {
    throw new Error("La verificación de la huella dactilar o rostro fue denegada.");
  }

  return assertion;
}
