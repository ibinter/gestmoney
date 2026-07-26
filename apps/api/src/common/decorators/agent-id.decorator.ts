import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Renvoie l'agentId enrichi par AgencyScopeGuard sur req.user.
 * Retourne null si l'utilisateur n'est pas rattaché à un agent.
 */
export const AgentId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.agentId || null;
  },
);
