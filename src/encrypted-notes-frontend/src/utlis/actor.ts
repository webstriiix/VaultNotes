import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { _SERVICE, idlFactory } from "../../../declarations/encrypted-notes-backend/encrypted-notes-backend.did.js";
import { canisterId } from "../../../declarations/encrypted-notes-backend/index.js";

export type BackendActor = ActorSubclass<_SERVICE>;

export function createBackendActor(identity?: any): BackendActor {
  const agent = new HttpAgent({
    identity,
    host: process.env.DFX_NETWORK === "ic"
      ? "https://ic0.app"
      : "http://127.0.0.1:4943",
  });

  if (process.env.DFX_NETWORK !== "ic") {
    agent.fetchRootKey();
  }

  return Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId,
  });
}

