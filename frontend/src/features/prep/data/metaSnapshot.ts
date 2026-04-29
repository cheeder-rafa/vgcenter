import type { SourceMetadata } from '../lib/snapshotFilter'

import generatedSnapshot from './metaSnapshot.generated.json'

export type MetaUsageEntry = {
  speciesName: string
  usagePercent: number
  rank: number
}

export type QualifiedTournament = {
  date: string
  name: string
  players: number
  winner: string
}

export type MetaSnapshot = {
  regulation: string
  checkedOn: string
  minimumPlayers: number
  usage: MetaUsageEntry[]
  qualifiedTournaments: QualifiedTournament[]
}

export type MetaSources = {
  limitless: SourceMetadata
  pikalytics: SourceMetadata
}

export const META_SOURCES: MetaSources = generatedSnapshot.sources

export const META_SNAPSHOT: MetaSnapshot = generatedSnapshot
