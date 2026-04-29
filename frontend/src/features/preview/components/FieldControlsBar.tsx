import { useState } from 'react'

import { usePreviewFieldStore } from '../store/usePreviewFieldStore'
import { usePreviewModeStore } from '../store/usePreviewModeStore'

const WEATHER_OPTIONS = [
  { value: 'CLEAR', label: 'Clear', symbol: '○' },
  { value: 'SUN', label: 'Sun', symbol: '☀' },
  { value: 'RAIN', label: 'Rain', symbol: '☂' },
  { value: 'SAND', label: 'Sand', symbol: '⬡' },
  { value: 'SNOW', label: 'Snow', symbol: '❄' },
] as const

const TERRAIN_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'GRASSY', label: 'Grass' },
  { value: 'ELECTRIC', label: 'Elec' },
  { value: 'MISTY', label: 'Mist' },
  { value: 'PSYCHIC', label: 'Psych' },
] as const

const ROOM_OPTIONS = [
  { value: 'NONE', label: 'Normal' },
  { value: 'TRICK', label: 'TR' },
  { value: 'WONDER', label: 'WR' },
] as const

const SCREEN_OPTIONS = [
  { key: 'reflect' as const, short: 'Ref' },
  { key: 'lightScreen' as const, short: 'LS' },
  { key: 'auroraVeil' as const, short: 'AV' },
]

export function FieldControlsBar() {
  const field = usePreviewFieldStore((s) => s.field)
  const setWeather = usePreviewFieldStore((s) => s.setWeather)
  const setTerrain = usePreviewFieldStore((s) => s.setTerrain)
  const setRoom = usePreviewFieldStore((s) => s.setRoom)
  const toggleSelectedTailwind = usePreviewFieldStore(
    (s) => s.toggleSelectedTailwind,
  )
  const toggleOpponentTailwind = usePreviewFieldStore(
    (s) => s.toggleOpponentTailwind,
  )
  const toggleSelectedScreen = usePreviewFieldStore(
    (s) => s.toggleSelectedScreen,
  )
  const toggleOpponentScreen = usePreviewFieldStore(
    (s) => s.toggleOpponentScreen,
  )

  const currentWeather = field.field.weather
  const currentTerrain = field.field.terrain
  const currentRoom = field.field.room
  const mode = usePreviewModeStore((s) => s.mode)
  const beginner = mode === 'beginner'
  const [showAdvanced, setShowAdvanced] = useState(false)
  const showAll = !beginner || showAdvanced

  return (
    <div className="arena-panel overflow-hidden">
      <div className="relative z-10 flex items-center gap-0 overflow-x-auto scrollbar-none">
        {/* Weather */}
        <ControlGroup label="Weather">
          {WEATHER_OPTIONS.map((opt) => {
            const active = currentWeather === opt.value
            return (
              <Chip
                key={opt.value}
                active={active}
                activeClass="border-arena-sun/60 bg-arena-sun/15 text-arena-sun"
                onClick={() => setWeather(opt.value)}
                title={opt.label}
              >
                <span className="mr-1 text-[0.7rem]">{opt.symbol}</span>
                {opt.label}
              </Chip>
            )
          })}
        </ControlGroup>

        <Divider />

        {/* Terrain */}
        <ControlGroup label="Terrain">
          {TERRAIN_OPTIONS.map((opt) => {
            const active = currentTerrain === opt.value
            return (
              <Chip
                key={opt.value}
                active={active}
                activeClass="border-arena-cyan/60 bg-arena-cyan/12 text-arena-cyan"
                onClick={() => setTerrain(opt.value)}
                title={opt.label}
              >
                {opt.label}
              </Chip>
            )
          })}
        </ControlGroup>

        <Divider />

        {/* Room */}
        <ControlGroup label="Room">
          {ROOM_OPTIONS.map((opt) => {
            const active = currentRoom === opt.value
            return (
              <Chip
                key={opt.value}
                active={active}
                activeClass="border-white/40 bg-white/10 text-white"
                onClick={() => setRoom(opt.value)}
                title={opt.label}
              >
                {opt.label}
              </Chip>
            )
          })}
        </ControlGroup>

        {beginner && !showAdvanced ? (
          <button
            type="button"
            onClick={() => setShowAdvanced(true)}
            className="ml-2 mr-3 shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-arena-cyan/80 hover:text-arena-cyan"
          >
            More field conditions ▸
          </button>
        ) : null}

        {showAll ? <Divider /> : null}

        {/* Tailwind */}
        {showAll ? (
        <ControlGroup label="Tailwind">
          <ToggleChip
            active={field.selectedSide.tailwind}
            activeClass="border-arena-cyan/60 bg-arena-cyan/12 text-arena-cyan"
            onClick={toggleSelectedTailwind}
          >
            My TW
          </ToggleChip>
          <ToggleChip
            active={field.opponentSide.tailwind}
            activeClass="border-arena-plasma/50 bg-arena-plasma/10 text-arena-plasma"
            onClick={toggleOpponentTailwind}
          >
            Opp TW
          </ToggleChip>
        </ControlGroup>
        ) : null}

        {showAll ? <Divider /> : null}

        {/* Screens */}
        {showAll ? (
          <>
            <ControlGroup label="Screens — Mine">
              {SCREEN_OPTIONS.map(({ key, short }) => (
                <ToggleChip
                  key={`my-${key}`}
                  active={field.selectedSide[key]}
                  activeClass="border-arena-cyan/60 bg-arena-cyan/12 text-arena-cyan"
                  onClick={() => toggleSelectedScreen(key)}
                >
                  {short}
                </ToggleChip>
              ))}
            </ControlGroup>

            <ControlGroup label="Screens — Opp">
              {SCREEN_OPTIONS.map(({ key, short }) => (
                <ToggleChip
                  key={`opp-${key}`}
                  active={field.opponentSide[key]}
                  activeClass="border-arena-plasma/50 bg-arena-plasma/10 text-arena-plasma"
                  onClick={() => toggleOpponentScreen(key)}
                >
                  {short}
                </ToggleChip>
              ))}
            </ControlGroup>
          </>
        ) : null}
      </div>
    </div>
  )
}

function ControlGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 px-3 py-2.5">
      <span className="mr-0.5 font-mono text-[0.56rem] uppercase tracking-[0.18em] text-white/32 whitespace-nowrap">
        {label}
      </span>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="h-6 w-px shrink-0 bg-white/8" />
}

function Chip({
  active,
  activeClass,
  onClick,
  title,
  children,
}: {
  active: boolean
  activeClass: string
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-6 items-center rounded border px-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arena-cyan/50 ${
        active
          ? activeClass
          : 'border-white/10 bg-transparent text-white/42 hover:border-white/24 hover:text-white/65'
      }`}
    >
      {children}
    </button>
  )
}

function ToggleChip({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean
  activeClass: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-6 items-center rounded border px-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arena-cyan/50 ${
        active
          ? activeClass
          : 'border-white/10 bg-transparent text-white/42 hover:border-white/24 hover:text-white/65'
      }`}
    >
      {children}
    </button>
  )
}
