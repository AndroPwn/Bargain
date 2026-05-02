import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import CarbonWidget from '../components/CarbonWidget'

const EMOJIS = ['','','','','','','','','','️','','⌚','','','']
function getEmoji(name) {
  const sum = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return EMOJIS[sum % EMOJIS.length]
}

// Normalise a participant object so CircleViz always has a stable `display_name`
// The /mine endpoint returns { user_id, display_name, confirmed }
// The /run  endpoint returns { id, listingId, listingCategory, wantCategory, display_name }
function normParticipant(p) {
  return {
    ...p,
    display_name: p.display_name || p.name || 'Trader',
  }
}

function CircleViz({ participants }) {
  // Guard: need at least 2 valid participants
  if (!Array.isArray(participants) || participants.length < 2) return null

  const safe = participants.slice(0, 4).map(normParticipant)
  const n = safe.length

  // Pre-computed positions for up to 4 nodes on a circle
  const positions = [
    { top: '10%', left: '50%' },
    { top: '78%', left: '17%' },
    { top: '78%', left: '83%' },
    { top: '44%', left: '5%'  },
  ]

  return (
    <div style={{ position: 'relative', width: 300, height: 300, margin: '12px auto 0' }}>
      <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 300 300" fill="none">
        <circle cx="150" cy="150" r="110" stroke="rgba(93,138,60,0.15)" strokeWidth="1.5" strokeDasharray="8 6" />
        {safe.map((_, i) => {
          const from = positions[i]
          const to   = positions[(i + 1) % n]
          if (!from || !to) return null
          const fx = parseFloat(from.left) / 100 * 300
          const fy = parseFloat(from.top)  / 100 * 300
          const tx = parseFloat(to.left)   / 100 * 300
          const ty = parseFloat(to.top)    / 100 * 300
          const mx = (fx + tx) / 2 + (ty - fy) * 0.3
          const my = (fy + ty) / 2 - (tx - fx) * 0.3
          return (
            <path
              key={i}
              d={`M${fx} ${fy} Q${mx} ${my} ${tx} ${ty}`}
              stroke="#a8c44a"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowM)"
            />
          )
        })}
        <defs>
          <marker id="arrowM" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#a8c44a" />
          </marker>
        </defs>
      </svg>
      {safe.map((p, i) => {
        const imgUrl = p.listingImageUrl || p.listing_image_url || null
        const initial = (p.display_name || '?')[0].toUpperCase()
        return (
          <div key={i} className="circle-node" style={positions[i]}>
            <div style={{
              width: 56, height: 56, borderRadius: 10,
              overflow: 'hidden', border: '2px solid hsl(130 45% 38%)',
              background: 'hsl(130 20% 90%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: 'hsl(130 45% 38%)',
              marginBottom: 4, flexShrink: 0,
            }}>
              {imgUrl
                ? <img src={imgUrl} alt={p.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initial
              }
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(28 25% 12%)', textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.display_name}
            </div>
            {(p.listingTitle || p.listing_title) && (
              <div style={{ fontSize: 10, color: 'hsl(130 15% 48%)', textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.listingTitle || p.listing_title}
              </div>
            )}
          </div>
        )
      })}
      <div className="circle-center"></div>
    </div>
  )
}

export default function Matches({ setPage, openChat, user }) {
  const [myMatches, setMyMatches] = useState([])
  const [suggested, setSuggested] = useState([])
  const [phones,    setPhones]    = useState({})
  const [loading,   setLoading]   = useState(true)
  const [running,   setRunning]   = useState(false)
  const [toast,     setToast]     = useState('')
  const [error,     setError]     = useState('')

  useEffect(() => {
    loadMine()

    // Listen for cancellations from other users — remove match instantly
    const socket = window.__ecoSocket
    if (socket) {
      socket.on('match_cancelled', ({ matchId }) => {
        setMyMatches(prev => prev.filter(m => m.id !== matchId))
        showToast('️ Someone backed out — that circle is broken.')
      })
      return () => socket.off('match_cancelled')
    }
  }, [])

  async function loadMine() {
    setLoading(true)
    setError('')
    try {
      const rows = await api.matches.mine()
      // Defensive: always store an array even if the API returns something unexpected
      setMyMatches(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setError(e.message)
      setMyMatches([])
    } finally {
      setLoading(false)
    }
  }

  async function runMatch() {
    setRunning(true)
    setError('')
    try {
      const res = await api.matches.run()
      const matches = Array.isArray(res?.matches) ? res.matches : []
      setSuggested(matches)
      if (matches.length === 0) setError('No matches found nearby yet. Post more items!')
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  async function acceptMatch(chain) {
    try {
      await api.matches.create(chain)
      setSuggested([])
      showToast('Circle accepted!  Scroll down to see your active trade.')
      await loadMine()
      // Scroll to active matches section
      setTimeout(() => {
        const el = document.getElementById('active-matches')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } catch (e) {
      setError(e.message)
    }
  }

  async function confirm(matchId) {
    try {
      const { allConfirmed } = await api.matches.confirm(matchId)
      if (allConfirmed) {
        const phoneList = await api.matches.phones(matchId)
        setPhones(p => ({ ...p, [matchId]: phoneList }))
        showToast('All confirmed! Contact details revealed ')
      } else {
        showToast('Confirmed! Waiting for others…')
      }
      loadMine()
    } catch (e) {
      setError(e.message)
    }
  }

  async function cancelMatch(matchId) {
    if (!window.confirm('Are you sure you want to back out of this trade? All listings will be re-activated.')) return
    try {
      await api.matches.cancel(matchId)
      setMyMatches(prev => prev.filter(m => m.id !== matchId))
      showToast('Trade cancelled. Your listings are active again.')
    } catch (e) {
      setError(e.message)
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getMatchName(match) {
    if (!Array.isArray(match.participants) || match.participants.length === 0) return 'Match'
    // /mine returns participants with `user_id` (not `id`)
    const myId = user?.id
    const others = match.participants.filter(p => (p.user_id ?? p.id) !== myId)
    if (others.length === 0) return 'Match'
    if (others.length === 1) return others[0].display_name || 'Trader'
    return others.map(p => p.display_name || 'Trader').join(', ')
  }

  const pending = myMatches.filter(m => m.status === 'pending')
  const done    = myMatches.filter(m => m.status !== 'pending')

  return (
    <div className="el-dash">
      <div className="el-dash-header">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: 'var(--soil)' }}>
            Active Matches
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 2 }}>
            {pending.length} pending · {done.length} completed
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={runMatch} disabled={running}>
            {running ? ' Finding…' : ' Find Matches'}
          </button>
          <button className="btn-outline" onClick={() => setPage('list')}>+ Add Item</button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(232,168,48,0.1)',
          border: '1px solid rgba(232,168,48,0.3)',
          borderRadius: 10,
          fontSize: 13,
          color: '#9a6c00',
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* ── Suggested circles (from Find Matches) ── */}
      {suggested.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase', color: 'var(--leaf)', marginBottom: 12,
          }}>
             Suggested Circles
          </div>
          {suggested.map((chain, i) => (
            <div className="el-match" key={i} style={{ borderColor: 'rgba(93,138,60,0.4)' }}>
              <div className="el-match-header">
                <span className="el-match-type type-circle">{chain.length}-Way Circle</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  +{chain.length >= 3 ? 40 : 20} Karma on completion
                </span>
              </div>
              <CircleViz participants={chain} />

              {/* Give/Want breakdown */}
              <div style={{ margin: '12px 0 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {chain.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'hsl(130 40% 96%)', borderRadius: 10, padding: '8px 12px',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(28 25% 12%)', minWidth: 60 }}>
                      {m.display_name || 'Trader'}
                    </span>
                    <span style={{ fontSize: 12, color: 'hsl(130 15% 48%)' }}>gives</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(130 45% 35%)' }}>
                      {m.listingTitle || m.title || '—'}
                    </span>
                    {(m.wantItemName || m.wantCategory) && <>
                      <span style={{ fontSize: 12, color: 'hsl(130 15% 48%)', marginLeft: 4 }}>→ wants</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(28 50% 40%)' }}>
                        {m.wantItemName || m.wantCategory}
                      </span>
                    </>}
                  </div>
                ))}
              </div>

              <CarbonWidget items={chain.map(m => m.listingTitle || m.title).filter(Boolean)} />
              <div className="el-match-actions" style={{ marginTop: 16 }}>
                <button
                  className="btn-accept"
                  onClick={() => acceptMatch(chain.map(m => ({ id: m.id, listingId: m.listingId })))}
                >
                   Accept this circle
                </button>
                <button
                  className="btn-decline"
                  onClick={() => setSuggested(s => s.filter((_, idx) => idx !== i))}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          Loading matches…
        </div>
      ) : pending.length === 0 && suggested.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--soil)', marginBottom: 6 }}>
            No active matches yet.
          </div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>
            Hit "Find Matches" to scan your area, or list more items.
          </div>
          <button className="btn-primary" onClick={() => setPage('list')}>List an Item</button>
        </div>
      ) : (
        pending.map(match => {
          const matchName = getMatchName(match)
          return (
            <div className="el-match" key={match.id}>
              <div className="el-match-header">
                <span className={`el-match-type type-${match.match_type === 'one_to_one' ? 'direct' : 'circle'}`}>
                  {match.match_type === 'one_to_one' ? 'Direct 1:1' : `${match.participant_count}-Way Circle`}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--soil)' }}>
                  with {matchName}
                </span>
              </div>

              {Array.isArray(match.participants) && match.participants.length > 0 && (
                <CircleViz participants={match.participants} />
              )}

              {phones[match.id] ? (
                <div style={{ margin: '16px 0' }}>
                  <p style={{ fontSize: 13, color: 'var(--leaf)', fontWeight: 600, marginBottom: 8 }}>
                     All confirmed — contact your circle:
                  </p>
                  {phones[match.id].map((p, i) => (
                    <a
                      key={i}
                      href={`https://wa.me/${p.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', marginBottom: 6,
                        background: 'rgba(93,138,60,0.06)',
                        border: '1px solid rgba(93,138,60,0.2)',
                        borderRadius: 8, textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: 18 }}></span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--soil)' }}>
                        {p.display_name}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--leaf)', marginLeft: 'auto' }}>
                        WhatsApp →
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}

              <div className="el-match-actions">
                {!match.i_confirmed && (
                  <button className="btn-accept" onClick={() => confirm(match.id)}>
                     Confirm my end
                  </button>
                )}
                {match.i_confirmed && !phones[match.id] && (
                  <div style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                    ⏳ Waiting for others to confirm…
                  </div>
                )}
                {match.phone_revealed && !phones[match.id] && (
                  <button className="btn-outline" onClick={async () => {
                    const list = await api.matches.phones(match.id)
                    setPhones(p => ({ ...p, [match.id]: list }))
                  }}>
                    Show contacts
                  </button>
                )}
                {!match.i_confirmed && (
                  <button
                    onClick={() => cancelMatch(match.id)}
                    style={{
                      padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: 'rgba(220,50,50,0.08)', color: '#c0392b',
                      border: '1px solid rgba(220,50,50,0.25)', cursor: 'pointer',
                    }}
                  >
                     Back Out
                  </button>
                )}
                <button
                  className="btn-outline"
                  onClick={() => openChat(match.id, matchName)}
                  style={{ marginLeft: 'auto' }}
                >
                   Chat
                </button>
              </div>
            </div>
          )
        })
      )}

      {done.length > 0 && (
        <>
          <div style={{
            fontSize: 12, fontWeight: 600, letterSpacing: 1,
            textTransform: 'uppercase', color: 'var(--muted)', margin: '24px 0 12px',
          }}>
            Completed
          </div>
          {done.map(match => (
            <div className="el-match" key={match.id} style={{ opacity: 0.55, pointerEvents: 'none' }}>
              <div className="el-match-header">
                <span className={`el-match-type type-${match.match_type === 'one_to_one' ? 'direct' : 'circle'}`}>
                  {match.match_type === 'one_to_one' ? 'Direct 1:1' : 'Circle'}
                </span>
                <span style={{ fontSize: 13, color: 'var(--leaf)', fontWeight: 600 }}> Completed</span>
              </div>
            </div>
          ))}
        </>
      )}

      {toast && <div className="el-toast">{toast}</div>}
    </div>
  )
}
