export interface JwtPayload {
  sub: string;        // userId
  email: string;
  tenantId: string;
  roles: string[];
  agentId?: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload extends JwtPayload {
  refreshToken?: string;
}
