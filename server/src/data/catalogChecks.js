// Integrity checks that run when the catalog loads. A broken catalog stops the server at boot
// instead of producing wrong scores at runtime.

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

export class CatalogError extends Error {
  constructor(message) {
    super(`Catalog integrity error: ${message}`)
    this.name = 'CatalogError'
  }
}

export function assertUniqueIds(kind, items) {
  const seen = new Set()
  for (const item of items) {
    if (!ID_PATTERN.test(item?.id ?? '')) throw new CatalogError(`${kind} id "${item?.id}" is not a valid slug`)
    if (seen.has(item.id)) throw new CatalogError(`duplicate ${kind} id "${item.id}"`)
    seen.add(item.id)
  }
}
