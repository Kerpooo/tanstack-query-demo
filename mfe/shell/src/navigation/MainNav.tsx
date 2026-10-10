import { NavLink } from 'react-router'
import { cn } from '@/shared/lib/utils'

const links = [
  { to: '/tasks', label: 'Tareas' },
  { to: '/users', label: 'Usuarios' },
  { to: '/query', label: 'TanStack Query' },
]

export function MainNav() {
  return (
    <nav aria-label="Principal" className="flex gap-1">
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -mb-px rounded-sm border-b-2 border-transparent px-3 py-4 text-sm font-medium outline-none focus-visible:ring-[3px]',
              isActive && 'border-state-fetching text-foreground',
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
