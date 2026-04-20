const dictionary = {
  'calculator.title': 'VGCenter Damage Calculator',
  'calculator.tagline': 'Regulation M-A · Pokémon Champions Battle Ops',
  'calculator.subtitle':
    'Configure attacker, defender, and field — the calculator mirrors the Champions battle circuit in real time.',
  'calculator.regulationLabel': 'Regulation',
  'panel.attacker': 'Attacker',
  'panel.defender': 'Defender',
  'panel.field': 'Field',
  'panel.result': 'Result',
  'result.waiting': 'Awaiting calculation — wire inputs to the backend in M9.',
} as const

type TranslationKey = keyof typeof dictionary

export function t(key: TranslationKey) {
  return dictionary[key]
}
