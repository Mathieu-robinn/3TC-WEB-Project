import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

/** Aligné sur l’ancien middleware express-rate-limit : 10 requêtes / minute / IP. */
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 10;

type WindowEntry = { count: number; windowStart: number };

/**
 * Comptage après validation du corps (login) : les requêtes invalides ne consomment pas le quota.
 */
@Injectable()
export class LoginRateLimitService {
  private readonly hits = new Map<string, WindowEntry>();

  assertAllowed(ip: string): void {
    const key = ip || "unknown";
    const now = Date.now();
    let entry = this.hits.get(key);
    if (!entry || now - entry.windowStart >= WINDOW_MS) {
      entry = { count: 0, windowStart: now };
      this.hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > MAX_PER_WINDOW) {
      throw new HttpException(
        "Trop de tentatives de connexion. Réessayez plus tard.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
