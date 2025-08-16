import { get, set } from "idb-keyval";
import * as vetkd from "@dfinity/vetkeys";

export class CryptoService {
  constructor(actor) {
    this.actor = actor;
    }

  // Encrypt JSON/text with note-key, return base64(IV || ciphertext)
  async encryptWithNoteKey(note_id, owner, data) {
    const noteKey = await this.getOrFetchNoteKey(note_id, owner);

    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      noteKey,
      enc.encode(data)
    );

    // concat iv + ciphertext then base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return base64FromBytes(combined);
  }

  // Decrypt base64(IV || ciphertext)
  async decryptWithNoteKey(note_id, owner, encryptedBase64) {
    const noteKey = await this.getOrFetchNoteKey(note_id, owner);

    const combined = bytesFromBase64(encryptedBase64);
    if (combined.length < 13) throw new Error("invalid ciphertext");
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      noteKey,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  }

  // Get cached CryptoKey or fetch+derive from backend
  async getOrFetchNoteKey(note_id, owner) {
    const keyId = [note_id.toString(), owner];
    let noteKey = await get(keyId);

    if (!noteKey) {
      //  generate ephemeral transport secret key
      const tsk = vetkd.TransportSecretKey.random();

      //  ask backend for encrypted symmetric key
      const ek_hex = await this.actor.encrypted_symmetric_key_for_note(
        note_id,
        Array.from(tsk.publicKeyBytes())
      );
      const encryptedVetKey = vetkd.EncryptedVetKey.deserialize(
        hexDecode(ek_hex)
      );

      //  ask backend for verification derived public key
      const dpk_hex = await this.actor.symmetric_key_verification_key_for_note();
      const dpk = vetkd.DerivedPublicKey.deserialize(hexDecode(dpk_hex));

      //  build input (note_id 128-bit BE + owner bytes)
      const note_id_bytes = bigintTo128BitBigEndianUint8Array(note_id);
      const owner_bytes = new TextEncoder().encode(owner);
      const input = new Uint8Array(note_id_bytes.length + owner_bytes.length);
      input.set(note_id_bytes, 0);
      input.set(owner_bytes, note_id_bytes.length);

      //  decrypt+verify locally
      const vetKey = encryptedVetKey.decryptAndVerify(tsk, dpk, input);

      //  derive AES-GCM CryptoKey
      const derivedMaterial = await vetKey.asDerivedKeyMaterial();
      noteKey = await derivedMaterial.deriveAesGcmCryptoKey("note-key");

      //  persist in IndexedDB
      await set(keyId, noteKey);
    }

    return noteKey;
  }
}


function hexDecode(hexString) {
  if (hexString.length % 2 !== 0) hexString = "0" + hexString;
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.slice(i, i + 2), 16);
  }
  return bytes;
}

function base64FromBytes(b) {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

function bytesFromBase64(b64) {
  const s = atob(b64);
  const arr = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
  return arr;
}

// Convert bigint to 128-bit big-endian Uint8Array (16 bytes)
function bigintTo128BitBigEndianUint8Array(bn) {
  let hex = bn.toString(16);
  while (hex.length < 32) hex = "0" + hex;
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

