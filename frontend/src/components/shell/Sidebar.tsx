import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/calc', label: 'Calculator' },
  { to: '/preview', label: 'Preview Coach' },
] as const

export function Sidebar() {
  return (
    <nav
      aria-label="Site navigation"
      className="flex shrink-0 flex-col gap-1 border-r border-white/10 bg-arena-surface px-2 py-4"
    >
      {NAV_ITEMS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              'rounded px-3 py-2 text-sm font-medium tracking-wide transition-colors',
              isActive
                ? 'bg-arena-accent/20 text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white',
            ].join(' ')
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
