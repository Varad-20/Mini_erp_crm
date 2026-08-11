export type ClassValue = string | number | bigint | boolean | undefined | null | { [key: string]: boolean | undefined | null } | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  return classes
    .flatMap((c) => {
      if (!c) return [];
      if (typeof c === 'string' || typeof c === 'number') return [String(c)];
      if (Array.isArray(c)) return [cn(...c)];
      if (typeof c === 'object') {
        return Object.entries(c)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return [];
    })
    .filter(Boolean)
    .join(' ');
}
