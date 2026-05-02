import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api.js'
import { MapPin, Package, X, Check, RefreshCw } from 'lucide-react'

const TIER_COLORS = {
  seedling: 'text-emerald-400 border-emerald-400/30',
  neighbor: 'text-green-400 border-green-400/30',
  pillar:   'text-teal-400 border-teal-400/30',
  guardian: 'text-cyan-400 border-cyan-400/30',
}

const TIER_LABELS = {
  seedling: 'Seedling',
  neighbor: 'Neighbor',
  pillar:   'Pillar',
  guardian: 'Guardian',
}

const CONDITION_COLOR = {
  new:  'bg-green-500/20 text-green-400 border-green-500/30',
  good: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  fair: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export default function Feed({ user, setPage }) {
  const [listings, setListings] = useState([])
  const [index, setIndex]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [gone, setGone]         = useState([]) // ids swiped away
  const [anim, setAnim]         = useState(null) // 'left' | 'right'

  // drag state
  const dragStart = useRef(null)
  const cardRef   = useRef(null)
  const [dragX, setDragX] = useState(0)
  const [toast, setToast]   = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await api.listings.feed(user?.geohash)
      setListings(data)
      setIndex(0)
      setGone([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const current = listings.filter(l => !gone.includes(l.id))[0]
  const next    = listings.filter(l => !gone.includes(l.id))[1]

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function onSwipeRight(item) {
    try {
      // Instantly create a 1:1 match — no AI, no listing required
      await api.matches.create([
        { id: user.id,       listingId: null    },
        { id: item.owner_id, listingId: item.id },
      ])
      showToast(' Matched! Taking you to Matches…')
    } catch (e) {
      showToast('️ ' + (e.message || 'Something went wrong'))
    } finally {
      setTimeout(() => setPage('matches'), 1500)
    }
  }

  function swipe(direction) {
    if (!current) return
    const item = current
    setAnim(direction)
    setTimeout(() => {
      setGone(g => [...g, item.id])
      setAnim(null)
      setDragX(0)
    }, 300)
    if (direction === 'right') onSwipeRight(item)
  }

  // drag handlers
  function onPointerDown(e) {
    dragStart.current = e.clientX
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (dragStart.current === null) return
    setDragX(e.clientX - dragStart.current)
  }

  function onPointerUp() {
    if (dragStart.current === null) return
    dragStart.current = null
    if (dragX > 80)       swipe('right')
    else if (dragX < -80) swipe('left')
    else setDragX(0)
  }

  const rotate = anim === 'right' ? 'rotate-6' : anim === 'left' ? '-rotate-6' : ''
  const translate = anim === 'right' ? 'translate-x-[120%]' : anim === 'left' ? '-translate-x-[120%]' : ''
  const dragRotate = dragX > 0 ? Math.min(dragX / 15, 8) : Math.max(dragX / 15, -8)

  if (loading) return (
    <div className="flex items-center justify-center h-[70vh]">
      <RefreshCw size={20} className="text-zinc-600 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-28 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-mono text-white font-bold text-lg">Nearby Exchange</h2>
          <p className="text-zinc-500 text-xs font-mono flex items-center gap-1">
            <MapPin size={10} /> {user?.neighborhood || 'Your area'} · 5km
          </p>
        </div>
        <button onClick={load} className="text-zinc-600 hover:text-zinc-400 transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Card stack */}
      {listings.filter(l => !gone.includes(l.id)).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Package size={40} className="text-zinc-700" />
          <p className="text-zinc-500 font-mono text-sm">No more items nearby.</p>
          <button onClick={load}
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 font-mono text-xs hover:border-zinc-500 transition-all">
            Refresh
          </button>
        </div>
      ) : (
        <div className="relative h-[68vh]">

          {/* Background card (next item) */}
          {next && (
            <div className="absolute inset-x-0 top-2 mx-auto w-[92%] h-full rounded-2xl bg-zinc-900 border border-zinc-800 scale-95 opacity-60" />
          )}

          {/* Main card */}
          {current && (
            <div
              ref={cardRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              style={{
                transform: anim
                  ? undefined
                  : `translateX(${dragX}px) rotate(${dragRotate}deg)`,
                cursor: 'grab',
              }}
              className={`absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden
                          flex flex-col transition-all duration-300 active:cursor-grabbing
                          ${anim ? `${translate} ${rotate} opacity-0` : ''}`}
            >
              {/* Like / Nope overlay indicators */}
              {dragX > 30 && (
                <div className="absolute top-6 left-6 z-10 border-2 border-green-500 text-green-400 font-mono font-bold text-xl px-3 py-1 rounded-lg rotate-[-15deg] opacity-90">
                  WANT
                </div>
              )}
              {dragX < -30 && (
                <div className="absolute top-6 right-6 z-10 border-2 border-red-500 text-red-400 font-mono font-bold text-xl px-3 py-1 rounded-lg rotate-[15deg] opacity-90">
                  SKIP
                </div>
              )}

              {/* Image */}
              <div className="flex-1 bg-zinc-800 relative overflow-hidden">
                {current.image_url ? (
                  <img
                    src={current.image_url}
                    alt={current.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={48} className="text-zinc-600" />
                  </div>
                )}

                {/* Karma badge overlay */}
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg border bg-zinc-950/80
                                  backdrop-blur text-xs font-mono ${TIER_COLORS[current.owner_tier] || TIER_COLORS.seedling}`}>
                  {TIER_LABELS[current.owner_tier] || 'Seedling'}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-semibold text-base leading-tight">{current.title}</h3>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0 ${CONDITION_COLOR[current.condition] || CONDITION_COLOR.good}`}>
                    {current.condition}
                  </span>
                </div>
                {/* Trade pair */}
                {(() => {
                  const want = (current.owner_wants || []).find(w => w.paired) || (current.owner_wants || [])[0]
                  return want?.item_name ? (
                    <div style={{
                      display:'flex', alignItems:'center', gap:8, marginBottom:8,
                      background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)',
                      borderRadius:10, padding:'8px 12px',
                    }}>
                      <div style={{flex:1,minWidth:0,textAlign:'center'}}>
                        <div style={{fontSize:9,fontWeight:700,color:'rgb(134,239,172)',textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>Gives</div>
                        <div style={{fontSize:12,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{current.title}</div>
                      </div>
                      <div style={{fontSize:16,flexShrink:0}}></div>
                      <div style={{flex:1,minWidth:0,textAlign:'center'}}>
                        <div style={{fontSize:9,fontWeight:700,color:'rgb(134,239,172)',textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>Wants</div>
                        <div style={{fontSize:12,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{want.item_name}</div>
                      </div>
                    </div>
                  ) : null
                })()}
                {current.description && (
                  <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 mb-2">{current.description}</p>
                )}
                <p className="text-zinc-600 text-xs font-mono flex items-center gap-1">
                  <MapPin size={9} /> {current.neighborhood}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {current && (
        <div className="flex items-center justify-center gap-6 mt-4">
          <button
            onClick={() => swipe('left')}
            className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center
                       text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all active:scale-95"
          >
            <X size={22} />
          </button>
          <button
            onClick={() => swipe('right')}
            className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center
                       text-green-400 hover:border-green-500/50 hover:bg-green-500/10 transition-all active:scale-95"
          >
            <Check size={22} />
          </button>
        </div>
      )}
      {toast && (
        <div style={{position:'fixed',bottom:90,left:'50%',transform:'translateX(-50%)',
          background:'#1a1a1a',color:'white',padding:'12px 20px',borderRadius:12,
          fontSize:14,fontWeight:600,zIndex:999,boxShadow:'0 4px 20px rgba(0,0,0,0.4)',whiteSpace:'nowrap'}}>
          {toast}
        </div>
      )}
    </div>
  )
}
