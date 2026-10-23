/*
  ⚡ LAYER: Service (Verification Toolkit checklist)
  🔒 SECURITY: Only catalog checklist items are accepted (also enforced by a foreign key). Rows are
     written as the verified user under RLS. Guest imports use keepExisting so they never overwrite
     newer account data.
  🚨 ERROR HANDLING: Duplicate items → 400; unknown items → 422 UNKNOWN_TOOLKIT_ITEM.
*/
import { TOOLKIT_ITEM_IDS, isToolkitItem } from '../data/toolkit.js'
import { badRequest, unprocessable } from '../utils/AppError.js'

export function summarizeToolkit(records) {
  const byId = new Map(records.map((record) => [record.itemId, record]))
  const items = Object.fromEntries(TOOLKIT_ITEM_IDS.map((id) => [id, byId.get(id)?.checked === true]))
  const updatedAt = records.reduce((latest, record) => (!latest || record.updatedAt > latest ? record.updatedAt : latest), null)
  return {
    items,
    checked: Object.values(items).filter(Boolean).length,
    total: TOOLKIT_ITEM_IDS.length,
    updatedAt,
  }
}

export async function getProgress(repo) {
  return summarizeToolkit(await repo.listToolkitProgress())
}

export async function saveProgress(repo, { items, keepExisting }) {
  const ids = items.map((item) => item.itemId)
  if (new Set(ids).size !== ids.length) throw badRequest('DUPLICATE_ITEM', 'Each checklist item can appear only once.')
  const unknown = ids.filter((id) => !isToolkitItem(id))
  if (unknown.length) {
    throw unprocessable('UNKNOWN_TOOLKIT_ITEM', 'Some checklist items do not exist.', { details: { itemIds: unknown } })
  }
  await repo.saveToolkitProgress(items, { keepExisting })
  return getProgress(repo)
}
