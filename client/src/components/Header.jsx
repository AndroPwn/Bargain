import { motion } from 'framer-motion'
import { Leaf, TreePine, Users, Recycle, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const TIER_EMOJI = { seedling: '🌱', neighbor: '🌿', pillar: '🌳', guardian: '♻️' }
const NAV = [
  { key: 'home',      label: 'Home' },
  { key: 'feed',      label: 'Explore' },
  { key: 'dashboard', label: 'My Trades' },
  { key: 'matches',   label: 'Matches' },
  { key: 'list',      label: '+ List' },
  { key: 'karma',     label: 'Karma' },
]

export default function Header({ user, page, setPage, onLogout, stats }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'hsl(42 30% 97% / 0.88)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid hsl(135 15% 88%)',
      }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 16, height: 62 }}>

        {/* Logo */}
        <button onClick={() => setPage('home')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20,
          color: 'hsl(135 50% 22%)', background: 'none', border: 'none', cursor: 'pointer',
          marginRight: 'auto', flexShrink: 0,
        }}>
          <img src='/ecoloop_transparent.png' alt='EcoLoop' style={{ height: 36 }} />
        </button>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }} className="hidden-mobile">
          {NAV.map(l => (
            <button key={l.key} onClick={() => setPage(l.key)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, transition: 'all .2s',
              background: page === l.key ? 'hsl(130 40% 92%)' : 'transparent',
              color: page === l.key ? 'hsl(135 50% 28%)' : 'hsl(130 15% 48%)',
              fontWeight: page === l.key ? 600 : 400,
            }}>{l.label}</button>
          ))}
        </nav>

        {/* Stats (desktop) */}
        {stats && (
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'hsl(130 15% 48%)', flexShrink: 0 }} className="hidden-tablet">
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TreePine size={12} /> {stats.total_listings || 0} items
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Recycle size={12} /> {stats.completed_matches || 0} trades
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={12} /> {stats.total_users || 0} traders
            </span>
          </div>
        )}

        {/* Right: user or sign in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {user ? (
            <>
              <button onClick={() => setPage('karma')} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                borderRadius: 20, background: 'hsl(130 40% 92%)',
                border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                color: 'hsl(135 50% 28%)',
              }}>
                <span>{TIER_EMOJI[user.tier] || '🌱'}</span>
                <span>{user.karma}</span>
                <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.7 }}>karma</span>
              </button>
              <button onClick={onLogout} title="Sign out" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'hsl(130 15% 48%)', padding: 6, borderRadius: 8,
                display: 'flex', alignItems: 'center',
              }}>
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setPage('login')} style={{ padding: '7px 18px', fontSize: 14 }}>
              Sign In
            </button>
          )}

          {/* Hamburger (mobile) */}
          <button onClick={() => setMenuOpen(o => !o)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'hsl(130 15% 48%)', padding: 6, borderRadius: 8,
            display: 'none',
          }} className="show-mobile">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            borderTop: '1px solid hsl(135 15% 88%)', padding: '12px 20px 16px',
            background: 'hsl(42 30% 97% / 0.96)', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
          {NAV.map(l => (
            <button key={l.key} onClick={() => { setPage(l.key); setMenuOpen(false) }} style={{
              padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, textAlign: 'left', transition: 'all .2s',
              background: page === l.key ? 'hsl(130 40% 92%)' : 'transparent',
              color: page === l.key ? 'hsl(135 50% 28%)' : 'hsl(28 25% 12%)',
              fontWeight: page === l.key ? 600 : 400,
            }}>{l.label}</button>
          ))}
        </motion.div>
      )}

      <style>{`
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } .show-mobile { display: flex !important; } }
        @media (max-width: 900px) { .hidden-tablet { display: none !important; } }
      `}</style>
    </motion.header>
  )
}
