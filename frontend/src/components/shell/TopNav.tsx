import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/calc', label: 'Calculator' },
  { to: '/preview', label: 'Preview Coach' },
] as const

export function TopNav() {
  return (
    <nav
      aria-label="Site navigation"
      className="fixed left-1/2 top-3 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-0.5 rounded-full border border-arena-violet/20 bg-arena-void/90 px-1.5 py-1.5 backdrop-blur-sm">
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'rounded-full px-5 py-2 font-body text-[0.72rem] font-medium uppercase tracking-[0.12em] transition-colors duration-200',
                isActive
                  ? 'bg-arena-plasma/10 text-white'
                  : 'text-white/40 hover:text-white/70',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
