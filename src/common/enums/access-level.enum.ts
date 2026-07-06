export enum AccessLevel {
  None = 'none',
  Read = 'read',
  Full = 'full',
}

const RANK: Record<AccessLevel, number> = {
  [AccessLevel.None]: 0,
  [AccessLevel.Read]: 1,
  [AccessLevel.Full]: 2,
};

// Does `granted` satisfy the `required` access level?
export function satisfies(
  granted: AccessLevel,
  required: AccessLevel,
): boolean {
  return RANK[granted] >= RANK[required];
}
