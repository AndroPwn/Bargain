import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import KarmaBadge from '../components/KarmaBadge.jsx'
import { Utensils, Clock, Plus, Check } from 'lucide-react'

function timeLeft(until) {
  const diff = new Date(until) - new Date()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default function Food() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [posting, setPosting]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm] = useState({ title: '', quantity: '', hours: '3', neighborhood: 'Koramangala', geohash: 'tdr1u' })

  useEffect(() => {
    api.food.list().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  async function handlePost(e) {
    e.preventDefault(); setPosting(true)
    try {
      const available_until = new Date(Date.now() + parseInt(form.hours) * 3600000).toISOString()
      await api.food.create({ ...form, available_until })
      setDone(true); setShowForm(false)
      setItems(await api.food.list())
    } catch (e) { setError(e.message) }
    finally { setPosting(false) }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-mono text-white font-bold text-lg">Food Surplus</h2>
          <p className="text-zinc-500 text-xs font-mono">Share leftover food before it goes to waste</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30
                     text-orange-400 rounded-lg text-xs font-mono hover:bg-orange-500/20 transition-all">
          <Plus size={12} />Post food
        </button>
      </div>

      {done && (
        <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-green-400 text-xs font-mono">
          <Check size={12} /> Posted! +20 Karma earned.
        </div>
      )}
      {error && <p className="text-red-400 font-mono text-xs mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={handlePost} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
          <p className="text-white font-mono text-sm font-bold">Post surplus food</p>
          <input required placeholder="What food? e.g. Leftover Biryani" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm
                       placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors" />
          <input required placeholder="Quantity e.g. Serves 4, 2kg rice" value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm
                       placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors" />
          <div>
            <label className="text-zinc-500 text-xs font-mono mb-1 block">Available for how long?</label>
            <div className="flex gap-2">
              {['1', '2', '3', '6'].map((h) => (
                <button key={h} type="button" onClick={() => setForm((f) => ({ ...f, hours: h }))}
                  className={`flex-1 py-2 rounded-lg border text-xs font-mono transition-all
                    ${form.hours === h ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={posting}
            className="w-full py-2 bg-orange-500/20 border border-orange-500/40 text-orange-400 font-mono text-sm rounded-lg hover:bg-orange-500/30 transition-all disabled:opacity-40">
            {posting ? 'Posting…' : 'Post →'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Utensils size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-mono text-sm">No surplus food nearby.</p>
          <p className="text-zinc-600 font-mono text-xs mt-1">Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🍱</span>
                    <span className="text-white font-medium text-sm">{item.title}</span>
                  </div>
                  <p className="text-zinc-400 text-xs font-mono mb-1">{item.quantity}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600 text-xs font-mono">{item.neighborhood}</span>
                    <span className="flex items-center gap-1 text-orange-400 text-xs font-mono">
                      <Clock size={9} />{timeLeft(item.available_until)}
                    </span>
                  </div>
                </div>
                <KarmaBadge tier={item.karma_tier} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
