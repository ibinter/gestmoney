import { Logger } from '@nestjs/common';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',    // Normal — appels passent
  OPEN = 'OPEN',        // Circuit ouvert — appels bloqués
  HALF_OPEN = 'HALF_OPEN', // Test — un seul appel autorisé
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;   // Nombre d'erreurs consécutives avant ouverture (défaut: 5)
  recoveryTimeoutMs?: number;  // Durée en ms avant tentative de récupération (défaut: 30 min)
  successThreshold?: number;   // Succès consécutifs en HALF_OPEN pour fermer (défaut: 1)
}

export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);

  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private openedAt?: Date;

  private readonly failureThreshold: number;
  private readonly recoveryTimeoutMs: number;
  private readonly successThreshold: number;

  constructor(
    private readonly name: string,
    options: CircuitBreakerOptions = {},
  ) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs ?? 30 * 60 * 1000; // 30 minutes
    this.successThreshold = options.successThreshold ?? 1;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      } else {
        const remaining = this.remainingCooldownMs();
        throw new Error(
          `Circuit breaker [${this.name}] est OUVERT. Retry dans ${Math.round(remaining / 1000)}s.`,
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.reset();
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (
      this.state === CircuitBreakerState.HALF_OPEN ||
      this.failureCount >= this.failureThreshold
    ) {
      this.trip();
    }
  }

  private trip(): void {
    this.transitionTo(CircuitBreakerState.OPEN);
    this.openedAt = new Date();
    this.logger.warn(
      `Circuit breaker [${this.name}] OUVERT après ${this.failureCount} erreurs consécutives. Réactivation dans ${this.recoveryTimeoutMs / 60000} min.`,
    );
  }

  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = undefined;
    this.transitionTo(CircuitBreakerState.CLOSED);
    this.logger.log(`Circuit breaker [${this.name}] FERMÉ — service restauré.`);
  }

  private transitionTo(state: CircuitBreakerState): void {
    this.logger.log(`Circuit breaker [${this.name}]: ${this.state} → ${state}`);
    this.state = state;
  }

  private shouldAttemptReset(): boolean {
    if (!this.openedAt) return false;
    return Date.now() - this.openedAt.getTime() >= this.recoveryTimeoutMs;
  }

  private remainingCooldownMs(): number {
    if (!this.openedAt) return 0;
    const elapsed = Date.now() - this.openedAt.getTime();
    return Math.max(0, this.recoveryTimeoutMs - elapsed);
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      openedAt: this.openedAt,
      remainingCooldownMs: this.state === CircuitBreakerState.OPEN ? this.remainingCooldownMs() : 0,
    };
  }

  forceOpen(): void {
    this.failureCount = this.failureThreshold;
    this.trip();
  }

  forceClose(): void {
    this.reset();
  }
}
