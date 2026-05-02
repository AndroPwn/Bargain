import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Star, Repeat2, Plus } from 'lucide-react'
import { api } from '../lib/api'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25,1,0.5,1] } } }

const CAT_EMOJI = { clothes:'🧥', books:'📚', electronics:'🖥️', food:'🍳', other:'📦' }
const STATUS_STYLE = {
  active:  { background:'hsl(130 40% 92%)', color:'hsl(130 50% 28%)' },
  matched: { background:'hsl(210 60% 92%)', color:'hsl(210 60% 28%)' },
  pending: { background:'hsl(40 80% 92%)',  color:'hsl(40 60% 35%)' },
}

export default function Dashboard({ setPage, user }) {
  const [listings, setListings] = useState([])
  const [matches,  setMatches]  = useState([])
  const [activity, setActivity] = useState([])
  const [wants,    setWants]    = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.allSettled([api.listings.mine(), api.matches.mine(), api.karma.history(), api.wants.list()])
      .then(([l, m, k, w]) => {
        if (l.status === 'fulfilled') setListings(l.value)
        if (m.status === 'fulfilled') setMatches(m.value)
        if (k.status === 'fulfilled') setActivity(k.value.slice(0, 5))
        if (w && w.status === 'fulfilled') setWants(w.value || [])
      }).finally(() => setLoading(false))
  }, [])

  const swapsDone = matches.filter(m => m.status === 'all_confirmed').length

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ paddingTop: 36 }}>

      {/* Header row */}
      <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 600, color: 'hsl(28 25% 12%)' }}>
            Hey, {user.name} 👋
          </h1>
          <p style={{ marginTop: 4, fontSize: 14, color: 'hsl(130 15% 48%)' }}>
            {user.city} · {listings.length} active listings
          </p>
        </div>
        <button className="btn-primary" onClick={() => setPage('list')} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> New Listing
        </button>
      </motion.div>

      {/* Stat chips */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { icon: <Star size={18} />,    label: 'Karma',    val: user.karma },
          { icon: <Repeat2 size={18} />, label: 'Trades',   val: swapsDone },
          { icon: <Package size={18} />, label: 'Listings', val: listings.length },
        ].map(s => (
          <div key={s.label} className="glass" style={{ borderRadius: 20, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: 'hsl(130 40% 92%)', color: 'hsl(135 50% 28%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "'Playfair Display', serif", color: 'hsl(28 25% 12%)' }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'hsl(130 15% 48%)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'hsl(130 15% 48%)', fontSize: 14 }}>Loading…</div>
      ) : (
        <motion.div variants={fadeUp} style={{ display: 'grid', gap: 20 }} className="dash-grid">
          {/* Listings */}
          <div className="glass" style={{ borderRadius: 24, padding: 24 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(130 15% 48%)', marginBottom: 16 }}>
              My Listings
            </p>
            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                <p style={{ fontSize: 14, color: 'hsl(130 15% 48%)', marginBottom: 16 }}>Nothing listed yet.</p>
                <button className="btn-primary" style={{ fontSize: 14, padding: '8px 20px' }} onClick={() => setPage('list')}>
                  List something →
                </button>
              </div>
            ) : listings.map((l, i) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < listings.length - 1 ? '1px solid hsl(135 15% 88%)' : 'none' }}>
                <div style={{ fontSize: 24, width: 36, textAlign: 'center' }}>{CAT_EMOJI[l.category] || '📦'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: 14, color: 'hsl(28 25% 12%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</p>
                  <p style={{ fontSize: 12, color: 'hsl(130 15% 48%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description || l.category}</p>
                </div>
                <span className="pill" style={{ flexShrink: 0, fontSize: 10, ...(STATUS_STYLE[l.status] || STATUS_STYLE.active) }}>
                  {l.status || 'active'}
                </span>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div className="glass" style={{ borderRadius: 24, padding: 24 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(130 15% 48%)', marginBottom: 16 }}>
              Recent Activity
            </p>
            {activity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
                <p style={{ fontSize: 14, color: 'hsl(130 15% 48%)' }}>No activity yet. Complete a trade to earn karma!</p>
              </div>
            ) : activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < activity.length - 1 ? '1px solid hsl(135 15% 88%)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'hsl(130 40% 92%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {a.action === 'circular_trade' ? '🔄' : a.action === 'donation' ? '💛' : '⭐'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'hsl(28 25% 12%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.description || a.action}
                  </p>
                  <p style={{ fontSize: 12, color: 'hsl(130 15% 48%)' }}>{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                {a.points > 0 && <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(130 45% 38%)', flexShrink: 0 }}>+{a.points}</span>}
              </div>
            ))}
          </div>

          
          {/* Wants */}
          <div className="glass" style={{ borderRadius: 24, padding: 24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <p style={{ fontFamily:"'DM Mono', monospace", fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'hsl(130 15% 48%)' }}>
                My Wants
              </p>
              <button onClick={() => setPage('list')} style={{ fontSize:12, color:'hsl(130 45% 38%)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                + Add Want
              </button>
            </div>
            {wants.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>🙏</div>
                <p style={{ fontSize:14, color:'hsl(130 15% 48%)', marginBottom:16 }}>No wants yet.</p>
                <button className="btn-primary" style={{ fontSize:14, padding:'8px 20px' }} onClick={() => setPage('list')}>
                  Add a want →
                </button>
              </div>
            ) : wants.map((w, i) => (
              <div key={w.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i < wants.length-1 ? '1px solid hsl(135 15% 88%)' : 'none' }}>
                <div style={{ fontSize:22, width:36, textAlign:'center' }}>🙏</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:14, color:'hsl(28 25% 12%)' }}>
                    {w.item_name || w.category}
                  </p>
                  {w.description && <p style={{ fontSize:12, color:'hsl(130 15% 48%)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{w.description}</p>}
                </div>
                <button onClick={() => api.wants.remove(w.id).then(() => setWants(ws => ws.filter(x => x.id !== w.id)))}
                  style={{ fontSize:18, background:'none', border:'none', cursor:'pointer', color:'hsl(0 50% 65%)', flexShrink:0 }}>×</button>
              </div>
            ))}
          </div>
          <style>{`@media (min-width: 820px) { .dash-grid { grid-template-columns: 1fr 1fr; } }`}</style>
        </motion.div>
      )}
    </motion.div>
  )
}
