import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { api } from '../lib/api'
import CarbonWidget from '../components/CarbonWidget'

const CAT_EMOJI = { clothes: '', books: '', electronics: '️', food: '', other: '' }
const COND_COLOR = { new: '#3d8c5a', good: '#5a7a3a', fair: '#a07a2a' }
const CATEGORIES = ['all', 'clothes', 'electronics', 'books', 'food', 'other']

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } } }

function wordMatch(text, search) {
  if (!search.trim()) return true
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  const hay = text.toLowerCase()
  return words.some(w => hay.includes(w))
}

export default function Browse({ user, setPage }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [wanted, setWanted] = useState(new Set())
  const [wantLoading, setWantLoading] = useState(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.listings.feed(user?.geohash)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
    api.wants.list()
      .then(ws => setWanted(new Set(ws.map(w => w.listing_id).filter(Boolean))))
      .catch(() => {})
  }, [])

  async function toggleWant(item) {
    if (wantLoading.has(item.id)) return
    setWantLoading(prev => new Set([...prev, item.id]))
    try {
      if (wanted.has(item.id)) {
        setWanted(prev => { const n = new Set(prev); n.delete(item.id); return n })
      } else {
        await api.wants.createForListing(item.id, item.category, item.title)
        setWanted(prev => new Set([...prev, item.id]))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setWantLoading(prev => { const n = new Set(prev); n.delete(item.id); return n })
    }
  }

  const filtered = items.filter(item => {
    const matchCat = filter === 'all' || item.category === filter
    const searchText = [item.title, item.description || ''].join(' ')
    const matchSearch = wordMatch(searchText, search)
    return matchCat && matchSearch
  })

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ paddingTop: 36 }}>
      <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 600, color: 'hsl(28 25% 12%)', marginBottom: 6 }}>
          Browse Items
        </h1>
        <p style={{ fontSize: 14, color: 'hsl(130 15% 48%)' }}>
          {items.length} items available — see what people offer and want in return
        </p>
      </motion.div>

      <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
        <input
          className="input-field"
          placeholder="  Search by any word…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </motion.div>

      <motion.div variants={fadeUp} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
            border: '1.5px solid',
            borderColor: filter === c ? 'hsl(130 45% 38%)' : 'hsl(135 15% 88%)',
            background: filter === c ? 'hsl(130 40% 92%)' : 'transparent',
            color: filter === c ? 'hsl(135 50% 28%)' : 'hsl(130 15% 48%)',
            cursor: 'pointer', transition: 'all .2s',
          }}>
            {c === 'all' ? 'All' : `${CAT_EMOJI[c]} ${c.charAt(0).toUpperCase() + c.slice(1)}`}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'hsl(130 15% 48%)', fontSize: 14 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}></div>
          <p style={{ color: 'hsl(130 15% 48%)', fontSize: 15 }}>No items found.</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setPage('list')}>+ List an Item</button>
        </motion.div>
      ) : (
        <motion.div variants={stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(item => (
            <motion.div key={item.id} variants={fadeUp} className="glass" style={{ borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                height: 120, background: 'hsl(130 20% 93%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 52, position: 'relative', overflow: 'hidden',
              }}>
                {item.image_url
                  ? <img src={item.image_url} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
                  : CAT_EMOJI[item.category] || ''
                }
                <button onClick={() => toggleWant(item)} style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 36, height: 36, borderRadius: '50%',
                  background: wanted.has(item.id) ? 'hsl(0 70% 60%)' : 'rgba(255,255,255,0.9)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }} title={wanted.has(item.id) ? 'Remove from wants' : 'I want this!'}>
                  <Heart size={16} fill={wanted.has(item.id) ? 'white' : 'none'} color={wanted.has(item.id) ? 'white' : 'hsl(0 60% 55%)'} />
                </button>
              </div>

              <div style={{ padding: '16px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: 'hsl(28 25% 12%)', lineHeight: 1.3 }}>{item.title}</p>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                    background: 'hsl(130 40% 92%)', color: COND_COLOR[item.condition] || '#5a7a3a',
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{item.condition}</span>
                </div>

                {item.description && (
                  <p style={{ fontSize: 12, color: 'hsl(130 15% 48%)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.description}
                  </p>
                )}

                {/* Carbon widget */}
                <CarbonWidget items={[item.title, ...((item.owner_wants||[]).find(w=>w.paired)||(item.owner_wants||[])[0])?.item_name ? [((item.owner_wants||[]).find(w=>w.paired)||(item.owner_wants||[])[0]).item_name] : []]} />

                {/* Trade pair */}
                {(() => {
                  const want = (item.owner_wants || []).find(w => w.paired) || (item.owner_wants || [])[0]
                  return want?.item_name ? (
                    <div style={{
                      marginTop:6, display:'flex', alignItems:'center', gap:8,
                      background:'hsl(130 40% 94%)', border:'1px solid hsl(130 40% 82%)',
                      borderRadius:12, padding:'8px 12px',
                    }}>
                      <div style={{flex:1,minWidth:0,textAlign:'center'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'hsl(130 40% 40%)',textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>Gives</div>
                        <div style={{fontSize:12,fontWeight:600,color:'hsl(28 25% 12%)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                      </div>
                      <div style={{fontSize:16,flexShrink:0}}></div>
                      <div style={{flex:1,minWidth:0,textAlign:'center'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'hsl(130 40% 40%)',textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>Wants</div>
                        <div style={{fontSize:12,fontWeight:600,color:'hsl(28 25% 12%)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{want.item_name}</div>
                      </div>
                    </div>
                  ) : null
                })()}

                <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'hsl(130 15% 55%)' }}> {item.neighborhood}</span>
                  <span style={{ fontSize: 12, color: 'hsl(130 15% 55%)' }}>by {item.owner_name}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
