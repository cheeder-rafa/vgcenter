const dictionary = {
  'calculator.title': 'VGCenter Damage Calculator',
  'calculator.subtitle':
    'Bootstrap scaffold for the Regulation M-A calculator, ready for domain logic, dataset loading, and API wiring.',
  'calculator.regulationLabel': 'Regulation',
} as const

type TranslationKey = keyof typeof dictionary

export function t(key: TranslationKey) {
  return dictionary[key]
}
