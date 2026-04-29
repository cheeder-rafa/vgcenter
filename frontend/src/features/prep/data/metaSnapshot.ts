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

export const META_SOURCES = {
  limitless: {
    name: 'Limitless Tournament Platform',
    url: 'https://play.limitlesstcg.com/tournaments/completed?game=VGC&format=M-A&platform=all&type=online&time=4weeks',
    policy:
      'Recent online Regulation M-A tournaments with at least 40 players.',
  },
  pikalytics: {
    name: 'Pikalytics Champions Tournaments',
    url: 'https://www.pikalytics.com/pokedex/championstournaments',
    policy: 'Pokemon Champions tournament usage percentages.',
  },
} as const

export const META_SNAPSHOT = {
  regulation: 'M-A',
  checkedOn: '2026-04-29',
  minimumPlayers: 40,
  usage: [
    { rank: 1, speciesName: 'Sneasler', usagePercent: 51.3 },
    { rank: 2, speciesName: 'Garchomp', usagePercent: 41.08 },
    { rank: 3, speciesName: 'Incineroar', usagePercent: 39.35 },
    { rank: 4, speciesName: 'Aerodactyl', usagePercent: 25.12 },
    { rank: 5, speciesName: 'Charizard', usagePercent: 19.32 },
    { rank: 6, speciesName: 'Milotic', usagePercent: 16.31 },
    { rank: 7, speciesName: 'Tyranitar', usagePercent: 14.08 },
    { rank: 8, speciesName: 'Pelipper', usagePercent: 12.9 },
    { rank: 9, speciesName: 'Whimsicott', usagePercent: 12.65 },
    { rank: 10, speciesName: 'Venusaur', usagePercent: 11.74 },
    { rank: 11, speciesName: 'Froslass', usagePercent: 10.51 },
    { rank: 12, speciesName: 'Aegislash', usagePercent: 8.82 },
    { rank: 13, speciesName: 'Meganium', usagePercent: 8.49 },
    { rank: 14, speciesName: 'Corviknight', usagePercent: 8.38 },
    { rank: 15, speciesName: 'Delphox', usagePercent: 8.3 },
    { rank: 16, speciesName: 'Dragonite', usagePercent: 7.45 },
    { rank: 17, speciesName: 'Talonflame', usagePercent: 7.4 },
    { rank: 18, speciesName: 'Gengar', usagePercent: 6.71 },
  ] satisfies MetaUsageEntry[],
  qualifiedTournaments: [
    {
      date: '2026-04-29',
      name: "HeroicTitan's VGC Battle Arena",
      players: 42,
      winner: '21kieran',
    },
    {
      date: '2026-04-28',
      name: 'The Drywalls Series #2 - Champions!',
      players: 53,
      winner: 'KingRexal',
    },
    {
      date: '2026-04-27',
      name: 'Pokepal Smackdown #138 (Champions) (Reg M-A)',
      players: 43,
      winner: 'Holasoy',
    },
    {
      date: '2026-04-27',
      name: 'Intimidators Champions Challenge #4 - REG M-A',
      players: 42,
      winner: 'NMR | Gostzin Igor Salino',
    },
    {
      date: '2026-04-27',
      name: "Head Bussa's Hoedown #29 Champions Reg M-A",
      players: 99,
      winner: 'Redsilver',
    },
    {
      date: '2026-04-27',
      name: "Boldore's Gate #8 - Champions Weekly",
      players: 62,
      winner: 'ismaaelh',
    },
    {
      date: '2026-04-27',
      name: 'Sketch Academy Champions Regulation M-A Tournament',
      players: 60,
      winner: 'Becko',
    },
    {
      date: '2026-04-26',
      name: 'Chaos League Sunday Slam #98',
      players: 59,
      winner: 'Gotou',
    },
    {
      date: '2026-04-26',
      name: 'Champions Costa Rica tour #1',
      players: 60,
      winner: 'Kaige',
    },
    {
      date: '2026-04-26',
      name: 'Rookidee VGC Cup',
      players: 64,
      winner: 'pikeon202',
    },
    {
      date: '2026-04-26',
      name: 'Rework Esport Champions Talent Cup',
      players: 126,
      winner: '4lphabet',
    },
    {
      date: '2026-04-26',
      name: 'Extreme Speed Pokemon Champions #3',
      players: 67,
      winner: 'BADM_3',
    },
  ] satisfies QualifiedTournament[],
} as const
