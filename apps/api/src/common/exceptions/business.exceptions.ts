import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

export class InsufficientFloatException extends BadRequestException {
  constructor(operateur: string, available: number, required: number) {
    super(
      `Float insuffisant pour ${operateur}. Disponible: ${available} FCFA, Requis: ${required} FCFA`,
    );
  }
}

export class AgentSuspendedException extends ForbiddenException {
  constructor(agentId: string) {
    super(`L'agent ${agentId} est suspendu et ne peut pas effectuer de transactions`);
  }
}

export class AgentNotFoundException extends NotFoundException {
  constructor(agentId: string) {
    super(`Agent introuvable: ${agentId}`);
  }
}

export class DailyLimitExceededException extends BadRequestException {
  constructor(agentId: string, limit: number, current: number) {
    super(
      `Limite journalière dépassée pour l'agent ${agentId}. Limite: ${limit} FCFA, Déjà effectué: ${current} FCFA`,
    );
  }
}

export class TransactionNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Transaction introuvable: ${id}`);
  }
}

export class TransactionNotCancellableException extends BadRequestException {
  constructor(id: string, status: string) {
    super(`La transaction ${id} (statut: ${status}) ne peut pas être annulée`);
  }
}

export class TransactionNotReversibleException extends BadRequestException {
  constructor(id: string, status: string) {
    super(`La transaction ${id} (statut: ${status}) ne peut pas être reversée`);
  }
}

export class FloatAccountNotFoundException extends NotFoundException {
  constructor(agentId: string, operateur: string) {
    super(`Compte float introuvable pour l'agent ${agentId} et l'opérateur ${operateur}`);
  }
}

export class InvalidAmountException extends BadRequestException {
  constructor(message: string) {
    super(`Montant invalide: ${message}`);
  }
}

export class CaisseAlreadyOpenException extends BadRequestException {
  constructor() {
    super('La caisse est déjà ouverte pour cette session');
  }
}

export class CaisseNotOpenException extends BadRequestException {
  constructor() {
    super('La caisse doit être ouverte avant toute opération');
  }
}

export class CommissionPlanNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Grille tarifaire introuvable: ${id}`);
  }
}
