import { importPokepaste } from '../calculator/api/importApi'
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

export function PokepasteImportModal({
  activeSide,
  onImportTeam,
  onLoadPokemon,
}: Props) {
  return (
    <ImportTeamModal
      activeSide={activeSide}
      accentClassName="text-arena-sun"
      description="Pull a Pokepaste URL through the backend client, then load imported team members straight into either side of the calculator."
      emptyState="Enter a Pokepaste link, import the roster, then choose which member should fill the attacker or defender slot."
      inputLabel="Pokepaste URL"
      inputPlaceholder="https://pokepast.es/abc123"
      submitLabel="Import Team"
      title="Import From Pokepaste"
      triggerLabel="Import Pokepaste"
      onImport={importPokepaste}
      onImportTeam={onImportTeam}
      onLoadPokemon={onLoadPokemon}
    />
  )
}
