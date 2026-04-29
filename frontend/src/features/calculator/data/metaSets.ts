export type MetaSet = {
  speciesId: string
  abilityId: string
  itemId: string | null
  moveIds: [string, string, string, string]
  sourceName: string
  sourceUrl: string
  checkedOn: string
}

export const PIKALYTICS_SOURCE = {
  sourceName: 'Pikalytics Champions Tournaments',
  sourceUrl: 'https://www.pikalytics.com/pokedex/championstournaments',
  checkedOn: '2026-04-29',
}

export const META_SETS: Record<string, MetaSet> = {
  sneasler: {
    speciesId: 'sneasler',
    abilityId: 'unburden',
    itemId: 'sitrus-berry',
    moveIds: ['poison-jab', 'dire-claw', 'close-combat', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  garchomp: {
    speciesId: 'garchomp',
    abilityId: 'rough-skin',
    itemId: 'choice-scarf',
    moveIds: ['earthquake', 'rock-slide', 'scale-shot', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  incineroar: {
    speciesId: 'incineroar',
    abilityId: 'intimidate',
    itemId: 'sitrus-berry',
    moveIds: ['fake-out', 'flare-blitz', 'darkest-lariat', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  aerodactyl: {
    speciesId: 'aerodactyl',
    abilityId: 'unnerve',
    itemId: 'focus-sash',
    moveIds: ['rock-slide', 'earthquake', 'tailwind', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  charizard: {
    speciesId: 'charizard',
    abilityId: 'blaze',
    itemId: 'sitrus-berry',
    moveIds: ['heat-wave', 'air-slash', 'dragon-dance', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  milotic: {
    speciesId: 'milotic',
    abilityId: 'competitive',
    itemId: 'sitrus-berry',
    moveIds: ['surf', 'ice-beam', 'recover', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  tyranitar: {
    speciesId: 'tyranitar',
    abilityId: 'sand-stream',
    itemId: 'sitrus-berry',
    moveIds: ['rock-slide', 'crunch', 'earthquake', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  pelipper: {
    speciesId: 'pelipper',
    abilityId: 'drizzle',
    itemId: 'sitrus-berry',
    moveIds: ['hurricane', 'surf', 'tailwind', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  whimsicott: {
    speciesId: 'whimsicott',
    abilityId: 'prankster',
    itemId: 'mental-herb',
    moveIds: ['tailwind', 'encore', 'helping-hand', 'moonblast'],
    ...PIKALYTICS_SOURCE,
  },
  venusaur: {
    speciesId: 'venusaur',
    abilityId: 'chlorophyll',
    itemId: 'sitrus-berry',
    moveIds: ['earth-power', 'sludge-bomb', 'sleep-powder', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  froslass: {
    speciesId: 'froslass',
    abilityId: 'cursed-body',
    itemId: 'focus-sash',
    moveIds: ['blizzard', 'shadow-ball', 'will-o-wisp', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  'aegislash-shield': {
    speciesId: 'aegislash-shield',
    abilityId: 'stance-change',
    itemId: 'leftovers',
    moveIds: ['kings-shield', 'shadow-ball', 'iron-head', 'wide-guard'],
    ...PIKALYTICS_SOURCE,
  },
  meganium: {
    speciesId: 'meganium',
    abilityId: 'overgrow',
    itemId: 'sitrus-berry',
    moveIds: ['energy-ball', 'heal-pulse', 'helping-hand', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  corviknight: {
    speciesId: 'corviknight',
    abilityId: 'mirror-armor',
    itemId: 'leftovers',
    moveIds: ['brave-bird', 'iron-head', 'tailwind', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  delphox: {
    speciesId: 'delphox',
    abilityId: 'magician',
    itemId: 'choice-scarf',
    moveIds: ['psychic', 'flamethrower', 'expanding-force', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  dragonite: {
    speciesId: 'dragonite',
    abilityId: 'multiscale',
    itemId: 'lum-berry',
    moveIds: ['extreme-speed', 'dragon-dance', 'earthquake', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  talonflame: {
    speciesId: 'talonflame',
    abilityId: 'gale-wings',
    itemId: 'sitrus-berry',
    moveIds: ['brave-bird', 'flare-blitz', 'tailwind', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
  gengar: {
    speciesId: 'gengar',
    abilityId: 'cursed-body',
    itemId: 'focus-sash',
    moveIds: ['shadow-ball', 'sludge-bomb', 'will-o-wisp', 'protect'],
    ...PIKALYTICS_SOURCE,
  },
}
