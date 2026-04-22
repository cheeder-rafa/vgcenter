export const WEATHER_OPTIONS = [
  { value: 'CLEAR', label: 'None' },
  { value: 'SUN', label: 'Sun' },
  { value: 'RAIN', label: 'Rain' },
  { value: 'SAND', label: 'Sandstorm' },
  { value: 'SNOW', label: 'Snow' },
] as const

export const TERRAIN_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'GRASSY', label: 'Grassy' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'MISTY', label: 'Misty' },
  { value: 'PSYCHIC', label: 'Psychic' },
] as const

export const ROOM_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'TRICK', label: 'Trick Room' },
  { value: 'WONDER', label: 'Wonder Room' },
] as const

export const STATUS_OPTIONS = [
  { value: 'NONE', label: 'Healthy' },
  { value: 'BURN', label: 'Burn' },
  { value: 'POISON', label: 'Poison (-1/8 HP/turn)' },
  { value: 'PARALYSIS', label: 'Paralysis' },
] as const

export const TYPE_OPTIONS = [
  'NORMAL',
  'FIRE',
  'WATER',
  'GRASS',
  'ELECTRIC',
  'ICE',
  'FIGHTING',
  'POISON',
  'GROUND',
  'FLYING',
  'PSYCHIC',
  'BUG',
  'ROCK',
  'GHOST',
  'DRAGON',
  'DARK',
  'STEEL',
  'FAIRY',
] as const

export const CATEGORY_OPTIONS = [
  { value: 'PHYSICAL', label: 'Physical' },
  { value: 'SPECIAL', label: 'Special' },
] as const
