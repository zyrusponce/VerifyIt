// Server catalog of "Before You Share" checklist items, shared with the frontend (src/data/checklist.js).
import { checklistItems } from '../../../src/data/checklist.js'
import { assertUniqueIds } from './catalogChecks.js'

assertUniqueIds('toolkit item', checklistItems)

export const toolkitItems = checklistItems.map((item, index) => ({ id: item.id, title: item.title, sortOrder: index + 1 }))

export const TOOLKIT_ITEM_IDS = toolkitItems.map((item) => item.id)

export function isToolkitItem(id) {
  return TOOLKIT_ITEM_IDS.includes(id)
}
