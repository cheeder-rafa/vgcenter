import type { CombatantBuild, FieldRequest, Regulation, SideConditions } from '../types/api'

const VERSION = 1

export type ShareableState = {
  regulation: Regulation
  attacker: CombatantBuild
  defender: CombatantBuild
  field: FieldRequest
  attackerSide: SideConditions
  defenderSide: SideConditions
  criticalHit: boolean
  targets: number
}

type Payload = {
  v: number
  reg: Regulation
  att: CombatantBuild
  def: CombatantBuild
  fld: FieldRequest
  aS: SideConditions
  dS: SideConditions
  ch: boolean
  tgt: number
}

export function encodeCalcState(state: ShareableState): string {
  const payload: Payload = {
    v: VERSION,
    reg: state.regulation,
    att: stripDerived(state.attacker),
    def: stripDerived(state.defender),
    fld: state.field,
    aS: state.attackerSide,
    dS: state.defenderSide,
    ch: state.criticalHit,
    tgt: state.targets,
  }
  return toBase64Url(JSON.stringify(payload))
}

export function decodeCalcState(encoded: string): ShareableState | null {
  if (!encoded) return null
  try {
    const json = fromBase64Url(encoded)
    const payload = JSON.parse(json) as Payload
    if (payload.v !== VERSION) return null
    return {
      regulation: payload.reg,
      attacker: payload.att,
      defender: payload.def,
      field: payload.fld,
      attackerSide: payload.aS,
      defenderSide: payload.dS,
      criticalHit: payload.ch,
      targets: payload.tgt,
    }
  } catch {
    return null
  }
}

function stripDerived(c: CombatantBuild): CombatantBuild {
  return { ...c, baseStats: null, finalStats: null }
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): string {
  const padded = str + '==='.slice(0, (4 - (str.length % 4)) % 4)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}
