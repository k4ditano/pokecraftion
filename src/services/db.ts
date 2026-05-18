import Dexie, { type Table } from 'dexie'

export interface MetaRow {
  id: number
  essences: number
  unlocks: Record<string, number>
}

class PokecraftionDb extends Dexie {
  meta!: Table<MetaRow, number>

  constructor() {
    super('pokecraftion')
    this.version(1).stores({
      meta: 'id',
    })
  }
}

export const db = new PokecraftionDb()

const META_ID = 1

export async function loadMeta(): Promise<MetaRow> {
  const row = await db.meta.get(META_ID)
  if (row) return row
  const fresh: MetaRow = { id: META_ID, essences: 0, unlocks: {} }
  await db.meta.put(fresh)
  return fresh
}

export async function saveMeta(
  essences: number,
  unlocks: Record<string, number>,
): Promise<void> {
  await db.meta.put({ id: META_ID, essences, unlocks })
}

export async function resetMeta(): Promise<void> {
  await db.meta.put({ id: META_ID, essences: 0, unlocks: {} })
}
