import { Actor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import * as vetkd from "@dfinity/vetkeys";

export class CryptoService {
    constructor(actor, identity) {
        this.actor = actor;
        this.identity = identity;
    }

    // --- ENCRYPT ---
    async encryptWithNoteKey(note_id, owner, data) {
        try {
            console.log("encryption begin")
            const noteKey = await this.getOrFetchNoteKey(note_id, owner);

            const enc = new TextEncoder();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const ciphertext = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                noteKey,
                enc.encode(data)
            );

            // concat iv + ciphertext → base64
            const combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(ciphertext), iv.length);

            const b64 = base64FromBytes(combined);
            console.log("Ciphertext length:", b64.length);
            return b64;
        } catch (err) {
            console.error("Encryption failed:", err);
            throw err;
        }
    }

    // --- DECRYPT ---
    async decryptWithNoteKey(note_id, owner, encryptedBase64) {
        try {
            const noteKey = await this.getOrFetchNoteKey(note_id, owner);

            const combined = bytesFromBase64(encryptedBase64);
            if (combined.length < 13) throw new Error("Invalid ciphertext length");

            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv },
                noteKey,
                ciphertext
            );
            return new TextDecoder().decode(decrypted);
        } catch (err) {
            console.error("Decryption failed:", err);
            throw err;
        }
    }

    // --- FETCH OR DERIVE NOTE KEY ---
   async getOrFetchNoteKey(note_id, owner) {
    console.log(`Deriving new note key for note_id=${note_id}, owner=${owner}`);

    // Ensure identity is used for this actor
    Actor.agentOf(this.actor).replaceIdentity(this.identity);

    try {
        // 1. Ephemeral transport secret key
        const tsk = vetkd.TransportSecretKey.random();

        // 2. Ask backend for encrypted symmetric key
        const ek_hex = await this.actor.encrypted_symmetric_key_for_note(
            BigInt(note_id),
            Array.from(tsk.publicKeyBytes())
        );
        const encryptedVetKey = vetkd.EncryptedVetKey.deserialize(hexDecode(ek_hex));

        // 3. Ask backend for verification key
        const dpk_hex = await this.actor.symmetric_key_verification_key_for_note();
        const dpk = vetkd.DerivedPublicKey.deserialize(hexDecode(dpk_hex));

        // 4. Build input: note_id (128-bit BE) + owner principal raw bytes
        const note_id_bytes = bigintTo128BitBigEndianUint8Array(BigInt(note_id));

        // ensure we always pass raw Principal bytes
        const owner_principal = Principal.fromText(
            typeof owner === "string" ? owner : owner.toText()
        );
        const owner_bytes = owner_principal.toUint8Array();

        const input = new Uint8Array(note_id_bytes.length + owner_bytes.length);
        input.set(note_id_bytes, 0);
        input.set(owner_bytes, note_id_bytes.length);

        // 5. Decrypt & verify
        const vetKey = encryptedVetKey.decryptAndVerify(tsk, dpk, input);

        // 6. Derive AES-GCM key
        const derivedMaterial = await vetKey.asDerivedKeyMaterial();
        const noteKey = await derivedMaterial.deriveAesGcmCryptoKey("note-key");

        console.log("Note key derived successfully ✅");
        return noteKey;
    } catch (err) {
        console.error("Failed to fetch/derive note key:", err);
        throw new Error("Invalid VetKey / key derivation failed");
    }
}
}

// --- HELPERS ---
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

function toHex(bytes) {
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
