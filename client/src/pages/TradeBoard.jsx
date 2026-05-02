import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { io } from 'socket.io-client'
import { api } from '../lib/api'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const CAT_EMOJI = { clothes:'🧥', books:'📚', electronics:'🖥️', food:'🍳', other:'📦' }
const stagger = { hidden:{}, show:{ transition:{ staggerChildren:0.05 } } }
const fadeUp  = { hidden:{ opacity:0, y:12 }, show:{ opacity:1, y:0, transition:{ duration:0.35 } } }

export default function TradeBoard({ user, setPage, openChat }) {
  const [view,        setView]        = useState('listings') // listings | boards | board
  const [listings,    setListings]    = useState([])
  const [boards,      setBoards]      = useState([])
  const [activeBoard, setActiveBoard] = useState(null)
  const [boardItems,  setBoardItems]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [interested,  setInterested]  = useState(new Set())
  const [newBoardName,setNewBoardName]= useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [toast,       setToast]       = useState('')
  const socketRef = useRef(null)

  useEffect(() => {
    api.trade.listings().then(setListings).catch(()=>{}).finally(()=>setLoading(false))
    api.trade.boards().then(setBoards).catch(()=>{})
  }, [])

  // Socket for live board collaboration
  useEffect(() => {
    if (!activeBoard) return
    const token = localStorage.getItem('ecoloop_token')
    const socket = io(BASE, { auth: { token }, transports: ['websocket','polling'] })
    socketRef.current = socket
    socket.emit('join_board', activeBoard.id)
    socket.on('board_updated', () => {
      api.trade.boardListings(activeBoard.id).then(setBoardItems).catch(()=>{})
    })
    return () => socket.disconnect()
  }, [activeBoard])

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''), 3000) }

  async function openBoard(board) {
    setActiveBoard(board)
    setView('board')
    const items = await api.trade.boardListings(board.id).catch(()=>[])
    setBoardItems(items)
  }

  async function createBoard() {
    if (!newBoardName.trim()) return
    const board = await api.trade.createBoard(newBoardName.trim()).catch(()=>null)
    if (!board) return
    setBoards(b => [board, ...b])
    setNewBoardName('')
    showToast('Board created!')
  }

  async function inviteToBoard() {
    if (!invitePhone.trim() || !activeBoard) return
    await api.trade.inviteToBoard(activeBoard.id, invitePhone.trim()).catch(e => showToast(e.message))
    setInvitePhone('')
    showToast('Invited!')
  }

  async function addToBoard(listingId) {
    if (!activeBoard) { showToast('Open a board first'); return }
    await api.trade.addToBoard(activeBoard.id, listingId).catch(()=>{})
    const items = await api.trade.boardListings(activeBoard.id)
    setBoardItems(items)
    socketRef.current?.emit('board_update', { boardId: activeBoard.id })
    showToast('Added to board!')
  }

  function toggleInterest(id) {
    setInterested(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const filtered = listings.filter(l =>
    !search.trim() ||
    search.toLowerCase().split(/\s+/).some(w =>
      l.title.toLowerCase().includes(w) ||
      (l.description||'').toLowerCase().includes(w) ||
      l.owner_name.toLowerCase().includes(w)
    )
  )

  return (
    <div style={{ paddingTop: 36 }}>
      {/* Top nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:600, color:'hsl(28 25% 12%)', marginBottom:4 }}>
            Trade Board
          </h1>
          <p style={{ fontSize:14, color:'hsl(130 15% 48%)' }}>Browse what people are offering and propose trades</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['listings','boards'].map(v => (
            <button key={v} onClick={()=>setView(v)} style={{
              padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:500,
              border:'1.5px solid', cursor:'pointer', transition:'all .2s',
              borderColor: view===v ? 'hsl(130 45% 38%)' : 'hsl(135 15% 88%)',
              background:  view===v ? 'hsl(130 40% 92%)' : 'transparent',
              color:       view===v ? 'hsl(135 50% 28%)' : 'hsl(130 15% 48%)',
            }}>{v === 'listings' ? '🏪 All Listings' : '📋 My Boards'}</button>
          ))}
          {activeBoard && (
            <button onClick={()=>setView('board')} style={{
              padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:500,
              border:'1.5px solid hsl(130 45% 38%)', background:'hsl(130 45% 38%)',
              color:'white', cursor:'pointer',
            }}>📌 {activeBoard.name}</button>
          )}
        </div>
      </div>

      {/* ── LISTINGS VIEW ── */}
      {view === 'listings' && (
        <>
          <input
            placeholder="🔍 Search by word, name, owner…"
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:12, border:'1px solid hsl(130 20% 85%)', fontSize:14, marginBottom:20, outline:'none' }}
          />
          {loading ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'hsl(130 15% 48%)' }}>Loading…</div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show"
              style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:18 }}>
              {filtered.map(item => (
                <motion.div key={item.id} variants={fadeUp} style={{
                  background:'white', borderRadius:20, overflow:'hidden',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.07)', display:'flex', flexDirection:'column',
                  border: interested.has(item.id) ? '2px solid hsl(130 45% 48%)' : '2px solid transparent',
                  transition:'border .2s',
                }}>
                  {/* Image */}
                  <div style={{ height:160, background:'hsl(130 15% 93%)', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', fontSize:56 }}>
                    {item.image_url
                      ? <img src={`${BASE}${item.image_url}`} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : CAT_EMOJI[item.category] || '📦'
                    }
                    <div style={{ position:'absolute', top:10, right:10, display:'flex', gap:6 }}>
                      <button onClick={()=>toggleInterest(item.id)} style={{
                        padding:'5px 10px', borderRadius:10, fontSize:12, fontWeight:600,
                        background: interested.has(item.id) ? 'hsl(130 45% 38%)' : 'rgba(255,255,255,0.92)',
                        color: interested.has(item.id) ? 'white' : 'hsl(130 40% 35%)',
                        border:'none', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.15)',
                      }}>
                        {interested.has(item.id) ? '✓ Interested' : '+ Interested'}
                      </button>
                    </div>
                  </div>

                  <div style={{ padding:'14px 16px 16px', flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <p style={{ fontWeight:700, fontSize:15, color:'hsl(28 25% 12%)', lineHeight:1.3 }}>{item.title}</p>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'hsl(130 40% 92%)', color:'hsl(130 50% 28%)', fontWeight:700, textTransform:'uppercase', flexShrink:0 }}>
                        {item.condition}
                      </span>
                    </div>

                    {item.description && (
                      <p style={{ fontSize:12, color:'hsl(130 15% 48%)', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                        {item.description}
                      </p>
                    )}

                    {/* Owner */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderTop:'1px solid hsl(130 15% 93%)', marginTop:4 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'hsl(130 30% 88%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                        {item.owner_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p style={{ fontSize:12, fontWeight:600, color:'hsl(28 25% 20%)' }}>{item.owner_name}</p>
                        <p style={{ fontSize:11, color:'hsl(130 15% 55%)' }}>⭐ {item.owner_karma} karma</p>
                      </div>
                    </div>

                    {/* Wants in return */}
                    {item.owner_wants?.length > 0 && (
                      <div style={{ padding:'8px 10px', background:'hsl(42 40% 95%)', borderRadius:10, borderLeft:'3px solid hsl(42 60% 65%)' }}>
                        <p style={{ fontSize:11, fontWeight:700, color:'hsl(42 40% 35%)', marginBottom:3 }}>🔄 Wants in return:</p>
                        {item.owner_wants.slice(0,2).map((w,i) => (
                          <p key={i} style={{ fontSize:12, color:'hsl(42 30% 40%)' }}>
                            {CAT_EMOJI[w.category]||'📦'} {w.item_name || w.category}
                            {w.description ? ` — ${w.description}` : ''}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:10 }}>
                      <button onClick={()=>addToBoard(item.id)} style={{
                        flex:1, padding:'8px', borderRadius:10, fontSize:12, fontWeight:600,
                        background:'hsl(130 40% 92%)', color:'hsl(130 50% 28%)', border:'none', cursor:'pointer',
                      }}>📋 Add to Board</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* ── BOARDS VIEW ── */}
      {view === 'boards' && (
        <div style={{ maxWidth:600 }}>
          <div style={{ display:'flex', gap:8, marginBottom:24 }}>
            <input
              placeholder="Board name…"
              value={newBoardName} onChange={e=>setNewBoardName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&createBoard()}
              style={{ flex:1, padding:'10px 14px', borderRadius:12, border:'1px solid hsl(130 20% 85%)', fontSize:14, outline:'none' }}
            />
            <button onClick={createBoard} style={{ padding:'10px 18px', borderRadius:12, background:'hsl(130 45% 38%)', color:'white', border:'none', cursor:'pointer', fontSize:14, fontWeight:600 }}>
              + Create
            </button>
          </div>

          {boards.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'hsl(130 15% 55%)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
              <p>No boards yet. Create one to collaborate with others.</p>
            </div>
          ) : boards.map(board => (
            <div key={board.id} onClick={()=>openBoard(board)} style={{
              padding:'16px 20px', background:'white', borderRadius:16, marginBottom:10,
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)', cursor:'pointer', border:'1.5px solid hsl(130 15% 92%)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              transition:'border .2s',
            }}>
              <div>
                <p style={{ fontWeight:700, fontSize:15, color:'hsl(28 25% 12%)' }}>{board.name}</p>
                <p style={{ fontSize:12, color:'hsl(130 15% 55%)', marginTop:2 }}>
                  by {board.creator_name} · {board.member_count} member{board.member_count!=1?'s':''}
                </p>
              </div>
              <span style={{ fontSize:20 }}>→</span>
            </div>
          ))}
        </div>
      )}

      {/* ── BOARD DETAIL VIEW ── */}
      {view === 'board' && activeBoard && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <button onClick={()=>setView('boards')} style={{ background:'none', border:'none', cursor:'pointer', color:'hsl(130 45% 38%)', fontSize:14 }}>← Boards</button>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:18, color:'hsl(28 25% 12%)', margin:0 }}>{activeBoard.name}</h2>
            <span style={{ fontSize:12, color:'hsl(130 15% 55%)', marginLeft:'auto' }}>
              🔴 Live — changes sync in real-time
            </span>
          </div>

          {/* Invite */}
          <div style={{ display:'flex', gap:8, marginBottom:20, padding:'14px 16px', background:'hsl(130 20% 96%)', borderRadius:14 }}>
            <input
              placeholder="Invite by phone number…"
              value={invitePhone} onChange={e=>setInvitePhone(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&inviteToBoard()}
              style={{ flex:1, padding:'8px 12px', borderRadius:10, border:'1px solid hsl(130 20% 85%)', fontSize:13, outline:'none' }}
            />
            <button onClick={inviteToBoard} style={{ padding:'8px 16px', borderRadius:10, background:'hsl(130 45% 38%)', color:'white', border:'none', cursor:'pointer', fontSize:13 }}>
              Invite
            </button>
          </div>

          {boardItems.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'hsl(130 15% 55%)' }}>
              <p>No listings added yet. Go to All Listings and click "Add to Board".</p>
              <button onClick={()=>setView('listings')} style={{ marginTop:12, padding:'10px 20px', borderRadius:12, background:'hsl(130 45% 38%)', color:'white', border:'none', cursor:'pointer', fontSize:14 }}>
                Browse Listings
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
              {boardItems.map(item => (
                <div key={item.id} style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                  <div style={{ height:120, background:'hsl(130 15% 93%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 }}>
                    {CAT_EMOJI[item.category]||'📦'}
                  </div>
                  <div style={{ padding:'12px 14px' }}>
                    <p style={{ fontWeight:700, fontSize:14, color:'hsl(28 25% 12%)' }}>{item.title}</p>
                    <p style={{ fontSize:12, color:'hsl(130 15% 55%)', marginTop:2 }}>by {item.owner_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'hsl(130 45% 30%)', color:'white', padding:'10px 20px', borderRadius:12, fontSize:14, fontWeight:600, zIndex:999, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
