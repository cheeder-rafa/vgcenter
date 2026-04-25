import { create } from 'zustand'

import type { FieldRequest, SideConditions } from '../../calculator/types/api'
import type { PreviewField } from '../types'

const DEFAULT_FIELD_REQUEST: FieldRequest = {
  weather: 'CLEAR',
  terrain: 'NONE',
  room: 'NONE',
}

const DEFAULT_SIDE: SideConditions = {
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  friendGuard: false,
  helpingHand: false,
  tailwind: false,
  protect: false,
}

const DEFAULT_FIELD: PreviewField = {
  field: { ...DEFAULT_FIELD_REQUEST },
  selectedSide: { ...DEFAULT_SIDE },
  opponentSide: { ...DEFAULT_SIDE },
  criticalHit: false,
  targets: 1,
}

type PreviewFieldState = {
  field: PreviewField
  setWeather: (weather: string) => void
  setTerrain: (terrain: string) => void
  setRoom: (room: string) => void
  toggleSelectedTailwind: () => void
  toggleOpponentTailwind: () => void
  toggleSelectedScreen: (screen: 'reflect' | 'lightScreen' | 'auroraVeil') => void
  toggleOpponentScreen: (screen: 'reflect' | 'lightScreen' | 'auroraVeil') => void
  reset: () => void
}

export const usePreviewFieldStore = create<PreviewFieldState>((set) => ({
  field: DEFAULT_FIELD,

  setWeather: (weather) =>
    set((state) => ({
      field: {
        ...state.field,
        field: { ...state.field.field, weather: weather as FieldRequest['weather'] },
      },
    })),

  setTerrain: (terrain) =>
    set((state) => ({
      field: {
        ...state.field,
        field: { ...state.field.field, terrain: terrain as FieldRequest['terrain'] },
      },
    })),

  setRoom: (room) =>
    set((state) => ({
      field: {
        ...state.field,
        field: { ...state.field.field, room: room as FieldRequest['room'] },
      },
    })),

  toggleSelectedTailwind: () =>
    set((state) => ({
      field: {
        ...state.field,
        selectedSide: {
          ...state.field.selectedSide,
          tailwind: !state.field.selectedSide.tailwind,
        },
      },
    })),

  toggleOpponentTailwind: () =>
    set((state) => ({
      field: {
        ...state.field,
        opponentSide: {
          ...state.field.opponentSide,
          tailwind: !state.field.opponentSide.tailwind,
        },
      },
    })),

  toggleSelectedScreen: (screen) =>
    set((state) => ({
      field: {
        ...state.field,
        selectedSide: {
          ...state.field.selectedSide,
          [screen]: !state.field.selectedSide[screen],
        },
      },
    })),

  toggleOpponentScreen: (screen) =>
    set((state) => ({
      field: {
        ...state.field,
        opponentSide: {
          ...state.field.opponentSide,
          [screen]: !state.field.opponentSide[screen],
        },
      },
    })),

  reset: () => set({ field: DEFAULT_FIELD }),
}))
