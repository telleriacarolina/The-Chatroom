// Frontend utilities
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter((c): c is string => Boolean(c) && typeof c === 'string')
    .join(' ')
}
