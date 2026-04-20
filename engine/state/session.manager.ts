import { store } from "./store";
import logger from "../lib/logger";

const SESSION_TTL = 60 * 60;           // 1 hour
const PREFIX = "session:";
const MAX_SESSION_DATA_BYTES = 64 * 1024;          // 64KB max session payload
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/; // safe alphanumeric only

export interface Session {
  id: string;
  createdAt: number;
  updatedAt: number;
  data: Record<string, unknown>;
}

function validateSessionId(sessionId: string): void {
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    throw new Error(
      `Invalid session ID format. Must be 8-128 alphanumeric characters (a-z, A-Z, 0-9, _, -)`
    );
  }
}

function assertSessionDataSize(data: Record<string, unknown>): void {
  const size = Buffer.byteLength(JSON.stringify(data), "utf-8");
  if (size > MAX_SESSION_DATA_BYTES) {
    throw new Error(
      `Session data exceeds maximum allowed size (${MAX_SESSION_DATA_BYTES / 1024}KB)`
    );
  }
}

export class SessionManager {
  private key(sessionId: string): string {
    // Prefix is hardcoded — callers cannot influence the key namespace
    return `${PREFIX}${sessionId}`;
  }

  async create(sessionId: string): Promise<Session> {
    validateSessionId(sessionId);

    const session: Session = {
      id: sessionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {},
    };

    await store.set(
      this.key(sessionId),
      JSON.stringify(session),
      "EX",
      SESSION_TTL
    );

    logger.info(`SessionManager: created session ${sessionId}`);
    return session;
  }

  async get(sessionId: string): Promise<Session | null> {
    validateSessionId(sessionId);

    const raw = await store.get(this.key(sessionId));
    if (!raw) return null;

    return JSON.parse(raw) as Session;
  }

  async update(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<Session | null> {
    validateSessionId(sessionId);

    const session = await this.get(sessionId);
    if (!session) return null;

    const merged = { ...session.data, ...data };

    // Check size before writing
    assertSessionDataSize(merged);

    session.data = merged;
    session.updatedAt = Date.now();

    await store.set(
      this.key(sessionId),
      JSON.stringify(session),
      "EX",
      SESSION_TTL
    );

    return session;
  }

  async destroy(sessionId: string): Promise<void> {
    validateSessionId(sessionId);

    await store.del(this.key(sessionId));
    logger.info(`SessionManager: destroyed session ${sessionId}`);
  }

  async exists(sessionId: string): Promise<boolean> {
    validateSessionId(sessionId);

    const count = await store.exists(this.key(sessionId));
    return count > 0;
  }
}

export const sessionManager = new SessionManager();