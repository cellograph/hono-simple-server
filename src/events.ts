import { createEmitter } from "@hono/event-emitter";

export type EmitterEvents = {
  "demo:team": { team: string };
};

export const emitter = createEmitter<EmitterEvents>();
