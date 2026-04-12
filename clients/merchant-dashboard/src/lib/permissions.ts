export function hasMerchantFullAccess(user: any): boolean {
  const scopes = Array.isArray(user?.scopes) ? user.scopes : [];
  return scopes.some((scope: string) => scope === 'merchant:*' || scope.startsWith('merchant:'));
}

export function hasScanAccess(user: any): boolean {
  const scopes = Array.isArray(user?.scopes) ? user.scopes : [];
  return scopes.some((scope: string) => scope === 'scan:*' || scope.startsWith('scan:'));
}

export function isScanOnlyUser(user: any): boolean {
  return hasScanAccess(user) && !hasMerchantFullAccess(user);
}
