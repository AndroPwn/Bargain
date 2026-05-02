import { NavLink } from 'react-router-dom'
import { Home, Plus, GitMerge, Heart, Utensils } from 'lucide-react'

const links = [
  { to: '/',        icon: Home,     label: 'Feed'    },
  { to: '/post',    icon: Plus,     label: 'Post'    },
  { to: '/matches', icon: GitMerge, label: 'Matches' },
  { to: '/ngos',    icon: Heart,    label: 'NGOs'    },
  { to: '/food',    icon: Utensils, label: 'Food'    },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-lg mx-auto flex">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] font-mono transition-colors
               ${isActive ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
