import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;

type WindowEntry = { count: number; windowStart: number };

@Injectable()
export class PasswordChangeRateLimitService {
  private readonly hits = new Map<string, WindowEntry>();

  assertAllowed(key: string): void {
    const bucketKey = key || "unknown";
    const now = Date.now();
    let entry = this.hits.get(bucketKey);
    if (!entry || now - entry.windowStart >= WINDOW_MS) {
      entry = { count: 0, windowStart: now };
      this.hits.set(bucketKey, entry);
    }

    entry.count += 1;
    if (entry.count > MAX_PER_WINDOW) {
      throw new HttpException(
        "Trop de tentatives de changement de mot de passe. Réessayez plus tard.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
