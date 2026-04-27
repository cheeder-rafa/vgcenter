import { importShowdown } from '../calculator/api/importApi'
import type { ImportedPokemon } from '../calculator/types/api'
import { ImportTeamModal } from './ImportTeamModal'

type Props = {
  activeSide: 'attacker' | 'defender'
  onImportTeam: (side: 'attacker' | 'defender', team: ImportedPokemon[]) => void
  onLoadPokemon: (
    side: 'attacker' | 'defender',
    pokemon: ImportedPokemon,
  ) => void
}

export function ShowdownImportModal({
  activeSide,
  onImportTeam,
  onLoadPokemon,
}: Props) {
  return (
    <ImportTeamModal
      activeSide={activeSide}
      accentClassName="text-arena-cyan"
      description="Paste a Showdown export to hydrate real stats, abilities, and held items directly from the backend importer."
      emptyState="Paste a team export, import it, then load any member into the attacker or defender side."
      inputLabel="Showdown Paste"
      inputPlaceholder="Charizard @ Charizardite Y"
      submitLabel="Import Team"
      title="Import From Showdown"
      triggerLabel="Import Showdown"
      sessionKey="showdown"
      multiline
      onImport={importShowdown}
      onImportTeam={onImportTeam}
      onLoadPokemon={onLoadPokemon}
    />
  )
}
