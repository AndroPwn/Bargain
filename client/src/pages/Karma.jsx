import { useState, useEffect } from 'react'
import { api } from '../lib/api'

const TIERS = [
  { name:'Seedling',  min:0,    max:99,   icon:'🌱', color:'#6aaa64' },
  { name:'Sprout',    min:100,  max:299,  icon:'🌿', color:'#5c8a3c' },
  { name:'Treeling',  min:300,  max:599,  icon:'🌳', color:'#3d5a2e' },
  { name:'Grove',     min:600,  max:1199, icon:'🏡', color:'#d4a017' },
  { name:'Forest',    min:1200, max:9999, icon:'🌲', color:'#2a7a8c' },
]

function getTier(karma) {
  return TIERS.find(t => karma >= t.min && karma <= t.max) || TIERS[0]
}

export default function Karma({ user }) {
  const [history,     setHistory]     = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [search, setSearch] = useState('')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([api.karma.history(), api.karma.leaderboard()])
      .then(([h, lb]) => { setHistory(h); setLeaderboard(lb) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const tier     = getTier(user.karma)
  const nextTier = TIERS[TIERS.indexOf(tier) + 1]
  const progress = nextTier
    ? ((user.karma - tier.min) / (nextTier.min - tier.min)) * 100
    : 100

  return (
    <div className="el-karma-page">
      <h2>Karma &amp; Reputation</h2>
      <p style={{color:'var(--muted)',fontSize:14,marginBottom:32}}>
        Earn points by completing trades, donating, and building trust.
      </p>

      {/* Karma card */}
      <div className="el-karma-big">
        <div style={{fontSize:48,marginBottom:8}}>{tier.icon}</div>
        <div className="k-num">{user.karma}</div>
        <div className="k-label">Karma Points · <strong style={{color:tier.color}}>{tier.name}</strong> tier</div>
        <div className="el-karma-bar">
          <div className="el-karma-fill" style={{width:`${progress}%`}} />
        </div>
        <div className="el-karma-tier">
          <span>{tier.name} ({tier.min})</span>
          {nextTier && <span>{nextTier.name} ({nextTier.min})</span>}
        </div>
        {nextTier && (
          <p style={{fontSize:13,color:'var(--muted)',marginTop:12}}>
            {nextTier.min - user.karma} more Karma to reach <strong>{nextTier.name}</strong>
          </p>
        )}
      </div>

      {/* How to earn */}
      <div className="el-card" style={{marginBottom:24}}>
        <div className="el-card-title"><span className="ct-dot"/>How to Earn Karma</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[
            { action:'Complete a Direct Swap',    pts:'+20', icon:'🤝' },
            { action:'Complete a 3-Way Circle',   pts:'+40', icon:'🔄' },
            { action:'Donate to an NGO',           pts:'+60', icon:'💛' },
            { action:'Receive 5-star review',      pts:'+10', icon:'⭐' },
            { action:'First listing of the month', pts:'+5',  icon:'📦' },
            { action:'Refer a friend',             pts:'+25', icon:'👥' },
          ].map(k => (
            <div key={k.action} style={{
              display:'flex',alignItems:'center',gap:12,
              padding:'12px 14px',background:'var(--bg)',
              borderRadius:'var(--r-sm)',border:'1px solid var(--border)',
            }}>
              <span style={{fontSize:22}}>{k.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--soil)'}}>{k.action}</div>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--leaf)'}}>{k.pts}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Karma leaderboard */}
      {!loading && leaderboard.length > 0 && (
        <div className="el-card" style={{marginBottom:24}}>
          <div className="el-card-title"><span className="ct-dot"/> Community Leaderboard</div>

          {/* Search bar */}
          <div style={{ padding: '0 4px 12px' }}>
            <input
              type="text"
              placeholder="Search by name or neighbourhood..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 14px', borderRadius: 10,
                border: '1.5px solid hsl(135 15% 88%)',
                fontSize: 13, background: 'hsl(135 10% 97%)',
                color: 'hsl(28 25% 12%)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="el-activity">
            {leaderboard
              .filter(u =>
                !search ||
                u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
                u.neighborhood?.toLowerCase().includes(search.toLowerCase())
              )
              .map((u, i) => (
                <div className="el-act-item" key={i} style={{ background: i === 0 && !search ? 'hsl(45 80% 96%)' : i === 1 && !search ? 'hsl(0 0% 97%)' : i === 2 && !search ? 'hsl(25 60% 96%)' : 'transparent', borderRadius: 10, padding: '8px 10px' }}>
                  <div className="el-act-icon" style={{ background: 'none', fontSize: 18, width: 36, fontWeight: 700, color: 'hsl(130 45% 38%)' }}>
                    {!search ? (i === 0 ? '1.' : i === 1 ? '2.' : i === 2 ? '3.' : `${i+1}.`) : `${i+1}.`}
                  </div>
                  <div className="el-act-info">
                    <h4 style={{ fontWeight: i < 3 && !search ? 700 : 500 }}>{u.display_name}</h4>
                    <p>{u.neighborhood} · {u.karma_tier}</p>
                  </div>
                  <div className="el-act-karma" style={{ color: i === 0 && !search ? 'hsl(45 70% 40%)' : 'hsl(130 45% 38%)' }}>
                    {u.karma} pts
                  </div>
                </div>
              ))
            }
            {search && leaderboard.filter(u =>
              u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
              u.neighborhood?.toLowerCase().includes(search.toLowerCase())
            ).length === 0 && (
              <p style={{ textAlign: 'center', color: 'hsl(130 15% 55%)', fontSize: 13, padding: '16px 0' }}>
                No users found for "{search}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Karma history */}
      {!loading && history.length > 0 && (
        <div className="el-card" style={{marginBottom:24}}>
          <div className="el-card-title"><span className="ct-dot"/>Your Karma History</div>
          <div className="el-activity">
            {history.map((h, i) => (
              <div className="el-act-item" key={i}>
                <div className="el-act-icon">
                  {h.action==='trade_completed'?'🔄':h.action==='donation'?'💛':'⭐'}
                </div>
                <div className="el-act-info">
                  <h4>{h.description || h.action}</h4>
                  <p>{new Date(h.created_at).toLocaleDateString()}</p>
                </div>
                {h.points && <div className="el-act-karma">+{h.points}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
