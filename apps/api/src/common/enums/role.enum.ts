export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  NETWORK_ADMIN = 'NETWORK_ADMIN',
  AGENCY_MANAGER = 'AGENCY_MANAGER',
  AGENT = 'AGENT',
  ACCOUNTANT = 'ACCOUNTANT',
  AUDITOR = 'AUDITOR',
  VIEWER = 'VIEWER',
}

export { RoleType as Role };

export const ROLE_HIERARCHY: Record<RoleType, number> = {
  [RoleType.SUPER_ADMIN]: 100,
  [RoleType.NETWORK_ADMIN]: 80,
  [RoleType.AGENCY_MANAGER]: 60,
  [RoleType.ACCOUNTANT]: 40,
  [RoleType.AUDITOR]: 30,
  [RoleType.AGENT]: 20,
  [RoleType.VIEWER]: 10,
};
