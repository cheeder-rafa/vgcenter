export type TournamentRow = {
  date: string
  name: string
  players: number
  winner: string
}

export type SourceMetadata = {
  sourceName: string
  sourceUrl: string
  checkedOn: string
  filterPolicy: string
}

export function filterTournamentsByMinPlayers(
  tournaments: TournamentRow[],
  minimumPlayers: number,
): TournamentRow[] {
  return tournaments.filter((t) => t.players >= minimumPlayers)
}

export function buildSourceMetadata(
  sourceName: string,
  sourceUrl: string,
  checkedOn: string,
  filterPolicy: string,
): SourceMetadata {
  return { sourceName, sourceUrl, checkedOn, filterPolicy }
}
