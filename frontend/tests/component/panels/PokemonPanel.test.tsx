import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PokemonPanel } from '../../../src/features/calculator/components/PokemonPanel'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'
import type {
  MoveDefinition,
  NamedDatasetEntry,
  NatureResponse,
  PokedexEntry,
} from '../../../src/features/calculator/types/api'

const pokedex: PokedexEntry[] = [
  {
    id: 'charizard',
    name: 'Charizard',
    imageUrl: '/sprites/charizard.png',
    types: ['FIRE', 'FLYING'],
    baseStats: {
      hp: 78,
      attack: 84,
      defense: 78,
      specialAttack: 109,
      specialDefense: 85,
      speed: 100,
    },
    abilityIds: ['blaze', 'solar-power'],
    moveIds: ['heat-wave', 'protect', 'air-slash'],
    megaForms: [
      {
        id: 'charizard-mega-x',
        name: 'Mega Charizard X',
        types: ['FIRE', 'DRAGON'],
        baseStats: {
          hp: 78,
          attack: 130,
          defense: 111,
          specialAttack: 130,
          specialDefense: 85,
          speed: 100,
        },
        abilityId: 'tough-claws',
      },
      {
        id: 'charizard-mega-y',
        name: 'Mega Charizard Y',
        types: ['FIRE', 'FLYING'],
        baseStats: {
          hp: 78,
          attack: 104,
          defense: 78,
          specialAttack: 159,
          specialDefense: 115,
          speed: 100,
        },
        abilityId: 'drought',
      },
    ],
  },
  {
    id: 'amoonguss',
    name: 'Amoonguss',
    imageUrl: '/sprites/amoonguss.png',
    types: ['GRASS', 'POISON'],
    baseStats: {
      hp: 114,
      attack: 85,
      defense: 70,
      specialAttack: 85,
      specialDefense: 80,
      speed: 30,
    },
    abilityIds: ['regenerator'],
    moveIds: ['spore', 'rage-powder'],
    megaForms: [],
  },
]

const abilities: NamedDatasetEntry[] = [
  { id: 'blaze', name: 'Blaze' },
  { id: 'solar-power', name: 'Solar Power' },
  { id: 'tough-claws', name: 'Tough Claws' },
  { id: 'drought', name: 'Drought' },
  { id: 'regenerator', name: 'Regenerator' },
  { id: 'levitate', name: 'Levitate' },
]

const items: NamedDatasetEntry[] = [
  { id: 'charizardite-x', name: 'Charizardite X' },
  { id: 'charizardite-y', name: 'Charizardite Y' },
  { id: 'froslassite', name: 'Froslassite' },
  { id: 'life-orb', name: 'Life Orb' },
  { id: 'sitrus-berry', name: 'Sitrus Berry' },
]

const moves: MoveDefinition[] = [
  {
    id: 'heat-wave',
    name: 'Heat Wave',
    type: 'FIRE',
    category: 'SPECIAL',
    basePower: 95,
    spread: true,
    contact: false,
    doublePowerWhenUserStatused: false,
    ignoreBurnPenaltyWhenUserStatused: false,
  },
  {
    id: 'protect',
    name: 'Protect',
    type: 'NORMAL',
    category: 'STATUS',
    basePower: 0,
    spread: false,
    contact: false,
    doublePowerWhenUserStatused: false,
    ignoreBurnPenaltyWhenUserStatused: false,
  },
  {
    id: 'air-slash',
    name: 'Air Slash',
    type: 'FLYING',
    category: 'SPECIAL',
    basePower: 75,
    spread: false,
    contact: false,
    doublePowerWhenUserStatused: false,
    ignoreBurnPenaltyWhenUserStatused: false,
  },
  {
    id: 'spore',
    name: 'Spore',
    type: 'GRASS',
    category: 'STATUS',
    basePower: 0,
    spread: false,
    contact: false,
    doublePowerWhenUserStatused: false,
    ignoreBurnPenaltyWhenUserStatused: false,
  },
  {
    id: 'rage-powder',
    name: 'Rage Powder',
    type: 'BUG',
    category: 'STATUS',
    basePower: 0,
    spread: false,
    contact: false,
    doublePowerWhenUserStatused: false,
    ignoreBurnPenaltyWhenUserStatused: false,
  },
]

const natures: NatureResponse[] = [
  { id: 'serious', name: 'Serious', increasedStat: null, decreasedStat: null },
  {
    id: 'timid',
    name: 'Timid',
    increasedStat: 'SPEED',
    decreasedStat: 'ATTACK',
  },
]

function renderPanel(onFocus = vi.fn()) {
  return {
    onFocus,
    ...render(
      <PokemonPanel
        side="attacker"
        pokedex={pokedex}
        abilities={abilities}
        items={items}
        natures={natures}
        moves={moves}
        focusedSide="attacker"
        focusedMoveIndex={0}
        onFocusSlot={onFocus}
      />,
    ),
  }
}

describe('PokemonPanel', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
  })

  it('renders a placeholder heading and sprite fallback when no species is selected', () => {
    renderPanel()
    expect(
      screen.getByRole('heading', { name: /attacker/i, level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /no pokémon/i })).toBeInTheDocument()
  })

  it('populates types and filters legal abilities when a species is selected', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesInput = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(speciesInput)
    await user.type(speciesInput, 'char')
    await user.keyboard('{ArrowDown}{Enter}')

    const state = useCalculatorStore.getState().attacker
    expect(state.speciesId).toBe('charizard')
    expect(state.types).toEqual(['FIRE', 'FLYING'])
    expect(state.grounded).toBe(false)
    expect(state.abilityId).toBe('blaze')

    const abilitySelect = screen.getByLabelText(
      /^ability$/i,
    ) as HTMLSelectElement
    const abilityValues = Array.from(abilitySelect.options).map(
      (option) => option.value,
    )
    // Abilities filtered to Charizard's legal set plus the empty option
    expect(abilityValues).toEqual(
      expect.arrayContaining(['', 'blaze', 'solar-power']),
    )
    expect(abilityValues).not.toContain('regenerator')
    expect(abilityValues).not.toContain('levitate')
  })

  it('filters move-slot options to the species learnset', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesInput = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(speciesInput)
    await user.type(speciesInput, 'char')
    await user.keyboard('{ArrowDown}{Enter}')

    const slot = screen.getByTestId('move-slot-0')
    const options = within(slot).getAllByRole('option')
    const values = options.map((option) => option.getAttribute('value'))

    expect(values).toEqual(
      expect.arrayContaining(['', 'heat-wave', 'protect', 'air-slash']),
    )
    expect(values).not.toContain('spore')
    expect(values).not.toContain('rage-powder')
  })

  it('focuses a move slot when clicked', async () => {
    const onFocus = vi.fn()
    renderPanel(onFocus)
    const user = userEvent.setup()

    await user.click(screen.getByTestId('move-slot-2'))
    expect(onFocus).toHaveBeenCalledWith('attacker', 2)
  })

  it('renders stable palette styling for species types and selected move badges', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesInput = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(speciesInput)
    await user.type(speciesInput, 'char')
    await user.keyboard('{ArrowDown}{Enter}')

    await user.selectOptions(screen.getByLabelText(/move slot 1/i), 'heat-wave')

    expect({
      fire: screen.getByTestId('types-attacker-FIRE').className,
      flying: screen.getByTestId('types-attacker-FLYING').className,
      move: screen.getByTestId('move-slot-type-0').className,
    }).toMatchInlineSnapshot(`
      {
        "fire": "arena-chip text-[0.62rem] tracking-[0.2em] border-[#ff9c54]/45 bg-[#ff9c54]/18 text-[#ffd4b4]",
        "flying": "arena-chip text-[0.62rem] tracking-[0.2em] border-[#8fa8ff]/45 bg-[#8fa8ff]/18 text-[#dde6ff]",
        "move": "arena-chip w-[8ch] justify-center overflow-hidden whitespace-nowrap text-[0.58rem] tracking-tight border-[#ff9c54]/45 bg-[#ff9c54]/18 text-[#ffd4b4]",
      }
    `)
  })

  it("changing species clears that side's moves and per-side results; does not affect opposite side", async () => {
    const store = useCalculatorStore.getState()
    store.setAttacker({
      speciesId: 'charizard',
      abilityId: 'blaze',
      baseStats: pokedex[0].baseStats,
      finalStats: pokedex[0].baseStats,
      types: ['FIRE', 'FLYING'],
      grounded: false,
    })
    store.setDefender({
      speciesId: 'amoonguss',
      abilityId: 'regenerator',
      baseStats: pokedex[1].baseStats,
      finalStats: pokedex[1].baseStats,
      types: ['GRASS', 'POISON'],
      grounded: true,
    })
    store.setMoveSlot('attacker', 0, 'heat-wave')
    store.setMoveSlot('attacker', 1, 'protect')
    store.setMoveSlot('defender', 0, 'spore')
    store.setResult('attacker', 0, {
      rolls: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
      min: 10,
      max: 25,
      minPct: 10,
      maxPct: 25,
      koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
    })
    store.setResult('defender', 0, {
      rolls: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
      min: 30,
      max: 45,
      minPct: 30,
      maxPct: 45,
      koChance: { description: 'Possible 2HKO', probability: 0.5, hits: 2 },
    })

    const onFocus = vi.fn()
    renderPanel(onFocus)
    const user = userEvent.setup()

    const speciesInput = screen.getByRole('combobox', { name: /^species$/i })
    await user.clear(speciesInput)
    await user.type(speciesInput, 'amoo')
    await user.keyboard('{ArrowDown}{Enter}')

    expect(useCalculatorStore.getState().attacker.speciesId).toBe('amoonguss')
    expect(useCalculatorStore.getState().attacker.moves).toEqual([
      { moveId: null },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ])
    expect(useCalculatorStore.getState().results.attackerMoves).toEqual([
      null,
      null,
      null,
      null,
    ])
    expect(useCalculatorStore.getState().defender.moves).toEqual([
      { moveId: 'spore' },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ])
    expect(useCalculatorStore.getState().results.defenderMoves[0]).toEqual(
      expect.objectContaining({ min: 30, max: 45 }),
    )
    expect(onFocus).toHaveBeenCalledWith('attacker', 0)
  })

  it('renders the Mega species prefix in the heading when mega evolution is active', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesInput = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(speciesInput)
    await user.type(speciesInput, 'char')
    await user.keyboard('{ArrowDown}{Enter}')
    await user.click(screen.getByLabelText(/mega evolution/i))

    expect(
      screen.getByRole('heading', { name: /^mega charizard$/i, level: 2 }),
    ).toBeInTheDocument()
    expect(useCalculatorStore.getState().attacker.speciesId).toBe('charizard')
    expect(useCalculatorStore.getState().attacker.megaActive).toBe(true)
  })

  it('showsMegaVariantPickerWhenSpeciesHasMultipleMegas', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesInput = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(speciesInput)
    await user.type(speciesInput, 'char')
    await user.keyboard('{ArrowDown}{Enter}')
    await user.click(screen.getByLabelText(/mega evolution/i))

    expect(screen.getByLabelText(/mega variant/i)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /mega charizard x/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /mega charizard y/i })).toBeInTheDocument()
  })

  it('selectsMegaCharizardXAndAutoFillsCharizarditeX', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesInput = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(speciesInput)
    await user.type(speciesInput, 'char')
    await user.keyboard('{ArrowDown}{Enter}')
    await user.click(screen.getByLabelText(/mega evolution/i))
    await user.selectOptions(screen.getByLabelText(/mega variant/i), 'charizard-mega-x')

    expect(useCalculatorStore.getState().attacker.megaFormId).toBe('charizard-mega-x')
    expect(useCalculatorStore.getState().attacker.itemId).toBe('charizardite-x')
  })

  it('switchingFromXToYReplacesStone', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesInput = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(speciesInput)
    await user.type(speciesInput, 'char')
    await user.keyboard('{ArrowDown}{Enter}')
    await user.click(screen.getByLabelText(/mega evolution/i))
    await user.selectOptions(screen.getByLabelText(/mega variant/i), 'charizard-mega-x')
    await user.selectOptions(screen.getByLabelText(/mega variant/i), 'charizard-mega-y')

    expect(useCalculatorStore.getState().attacker.megaFormId).toBe('charizard-mega-y')
    expect(useCalculatorStore.getState().attacker.itemId).toBe('charizardite-y')
  })

  it('togglingMegaOffPreservesExistingItem', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesInput = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(speciesInput)
    await user.type(speciesInput, 'char')
    await user.keyboard('{ArrowDown}{Enter}')
    await user.click(screen.getByLabelText(/^item$/i))
    await user.selectOptions(screen.getByLabelText(/^item$/i), 'life-orb')
    await user.click(screen.getByLabelText(/mega evolution/i))
    await user.click(screen.getByLabelText(/mega evolution/i))

    expect(useCalculatorStore.getState().attacker.megaActive).toBe(false)
    expect(useCalculatorStore.getState().attacker.itemId).toBe('charizardite-x')
  })
})
