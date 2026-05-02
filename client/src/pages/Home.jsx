import { motion } from 'framer-motion'
import { Leaf, TreePine, Users, Recycle, ArrowRight, ChevronRight } from 'lucide-react'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.5, 1] } } }

function StatCard({ icon, label, value }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass" style={{ borderRadius: 20, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'hsl(130 15% 48%)', marginBottom: 8 }}>
        <span style={{ width: 24, height: 24, borderRadius: 8, background: 'hsl(130 40% 92%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(135 50% 28%)' }}>{icon}</span>
        {label}
      </div>
      <p style={{ fontSize: 24, fontWeight: 600, fontFamily: "'Playfair Display', serif", color: 'hsl(28 25% 12%)' }}>{value}</p>
    </motion.div>
  )
}

function CircleViz() {
  const nodes = [
    { top: '8%',  left: '46%', emoji: '🧥', name: 'Riya',  item: 'Jacket' },
    { top: '76%', left: '14%', emoji: '📚', name: 'Arjun', item: 'Books' },
    { top: '76%', left: '78%', emoji: '💡', name: 'Kabir', item: 'Lamp' },
  ]
  return (
    <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 280 280" fill="none">
        <circle cx="140" cy="140" r="105" stroke="hsl(130 45% 38% / 0.15)" strokeWidth="1.5" strokeDasharray="8 6" />
        <path d="M140 42 Q220 95 220 218" stroke="hsl(130 45% 38%)" strokeWidth="2" fill="none" markerEnd="url(#ah)" opacity="0.7" />
        <path d="M220 218 Q95 265 62 150" stroke="hsl(130 45% 38%)" strokeWidth="2" fill="none" markerEnd="url(#ah)" opacity="0.7" />
        <path d="M62 150 Q75 38 140 42" stroke="hsl(130 45% 38%)" strokeWidth="2" fill="none" markerEnd="url(#ah)" opacity="0.7" />
        <defs>
          <marker id="ah" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="hsl(130 45% 38%)" />
          </marker>
        </defs>
      </svg>
      {nodes.map((n, i) => (
        <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200 }}
          style={{ position: 'absolute', top: n.top, left: n.left, transform: 'translate(-50%,-50%)' }}>
          <div className="glass" style={{ borderRadius: 16, padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 60 }}>
            <span style={{ fontSize: 22 }}>{n.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'hsl(28 25% 12%)' }}>{n.name}</span>
            <span style={{ fontSize: 9, color: 'hsl(130 15% 48%)' }}>{n.item}</span>
          </div>
        </motion.div>
      ))}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, hsl(130 45% 38%), hsl(135 55% 28%))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: '0 0 20px hsl(130 45% 38% / 0.3)',
        }}>♻️</div>
      </motion.div>
    </div>
  )
}

export default function Home({ setPage, stats, user }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ paddingTop: 40 }}>

      {/* Hero */}
      <motion.section variants={fadeUp} style={{ display: 'grid', gap: 40, marginBottom: 48, alignItems: 'center' }}
        className="hero-grid">
        <div>
          <span className="pill" style={{ background: 'hsl(130 40% 92%)', color: 'hsl(135 50% 28%)', marginBottom: 16, display: 'inline-flex' }}>
            <Leaf size={12} /> Hyper-local · Non-monetary
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.15, marginTop: 12, marginBottom: 16, color: 'hsl(28 25% 12%)' }}>
            Your stuff has value.{' '}
            <span className="text-gradient-forest">Give it a second life.</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'hsl(130 15% 48%)', maxWidth: 460, marginBottom: 32 }}>
            EcoLoop's circular matching engine connects local swappers in multi-person
            trade circles — turning idle stuff into community gold, no money needed.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button className="btn-primary" onClick={() => setPage(user ? 'list' : 'login')}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              List Your First Item <ArrowRight size={16} />
            </button>
            <button className="btn-outline" onClick={() => setPage(user ? 'matches' : 'login')}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              See Live Matches <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="glass" style={{ borderRadius: 28, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'hsl(130 15% 48%)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Perfect Circle · Active Now
            </span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(130 45% 38%)', display: 'inline-block' }} />
          </div>
          <CircleViz />
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid hsl(135 15% 88%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'hsl(130 15% 48%)' }}>
              Riya → Arjun → Kabir → Riya
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(130 45% 38%)' }}>+40 Karma</span>
          </div>
        </div>

        <style>{`
          .hero-grid { grid-template-columns: 1fr; }
          @media (min-width: 860px) { .hero-grid { grid-template-columns: 1fr 1fr; } }
        `}</style>
      </motion.section>

      {/* Stats */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
        <StatCard icon={<TreePine size={12} />} label="Items Listed"  value={stats?.total_listings || '—'} />
        <StatCard icon={<Recycle size={12} />}  label="Trades Done"   value={stats?.completed_matches || '—'} />
        <StatCard icon={<Users size={12} />}    label="Local Traders" value={stats?.total_users || '—'} />
      </motion.div>

      {/* How it works */}
      <motion.section variants={fadeUp} style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(130 15% 48%)', marginBottom: 8 }}>
            The System
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'hsl(28 25% 12%)' }}>
            The 4-step journey
          </h2>
        </div>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { n: '01', title: 'List & Request',    desc: 'Post what you have and add your neighbourhood for local matching.' },
            { n: '02', title: 'Match & Notify',    desc: 'Engine scans for direct swaps or 3-way circles nearby, alerts you instantly.' },
            { n: '03', title: 'Confirm & Connect', desc: 'Review the circle, accept the match, get your partner\'s contact.' },
            { n: '04', title: 'Exchange & Earn',   desc: 'Meet locally, swap, confirm on-app, collect Karma points.' },
          ].map(s => (
            <motion.div key={s.n} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}
              className="glass" style={{ borderRadius: 20, padding: 22 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: 'hsl(135 15% 88%)', marginBottom: 10 }}>{s.n}</div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(28 25% 12%)', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'hsl(130 15% 48%)' }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Trade types */}
      <motion.section variants={fadeUp} style={{ marginBottom: 60 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'hsl(28 25% 12%)' }}>
            Three ways to swap
          </h2>
        </div>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { icon: '🤝', tag: 'Direct · 1:1',     title: 'Direct Swap',    desc: 'Simple two-way exchange. Fastest path to a trade.' },
            { icon: '🔄', tag: 'Flagship · 3-Way', title: 'Circular Trade', desc: 'Our engine forms 3+ person trade circles automatically.' },
            { icon: '💛', tag: 'Social · Donate',  title: 'NGO Donate',     desc: 'One-way donation to a verified NGO. Max karma, max impact.' },
          ].map(t => (
            <motion.div key={t.title} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}
              className="glass" style={{ borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{t.icon}</div>
              <span className="pill" style={{ background: 'hsl(130 40% 92%)', color: 'hsl(135 50% 28%)', marginBottom: 12, fontSize: 10 }}>
                {t.tag}
              </span>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, marginBottom: 8, color: 'hsl(28 25% 12%)', marginTop: 8 }}>{t.title}</h3>
              <p style={{ fontSize: 13, color: 'hsl(130 15% 48%)', lineHeight: 1.55 }}>{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

    </motion.div>
  )
}
