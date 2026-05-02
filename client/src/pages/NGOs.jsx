import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { Heart, Check, Star } from 'lucide-react'

export default function NGOs() {
  const [ngos, setNgos]       = useState([])
  const [loading, setLoading] = useState(true)
  const [donated, setDonated] = useState({})
  const [error, setError]     = useState('')

  useEffect(() => {
    api.ngos.list().then(setNgos).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  async function donate(ngoId, wantId) {
    try {
      const { karmaAwarded } = await api.ngos.donate(ngoId, wantId)
      setDonated((d) => ({ ...d, [wantId]: karmaAwarded }))
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      <div className="mb-6">
        <h2 className="font-mono text-white font-bold text-lg">NGO Wishlist</h2>
        <p className="text-zinc-500 text-xs font-mono">Donate directly to what they actually need. Earns highest Karma.</p>
      </div>

      {error && <p className="text-red-400 font-mono text-xs mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-zinc-900 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {ngos.map((ngo) => (
            <div key={ngo.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <Heart size={16} className="text-pink-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{ngo.name}</span>
                    {ngo.verified && (
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">✓ verified</span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5">{ngo.description}</p>
                  <p className="text-zinc-600 text-xs font-mono">{ngo.area}</p>
                </div>
              </div>

              {ngo.wishlist?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">They need:</p>
                  {ngo.wishlist.map((want) => (
                    <div key={want.id} className="flex items-center justify-between bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-zinc-300 text-sm">{want.description}</span>
                        <span className="text-zinc-600 text-xs font-mono ml-2">×{want.quantity}</span>
                      </div>
                      {donated[want.id] ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs font-mono">
                          <Check size={12} />+{donated[want.id]} karma
                        </span>
                      ) : (
                        <button onClick={() => donate(ngo.id, want.id)}
                          className="text-xs font-mono px-3 py-1 bg-pink-500/10 border border-pink-500/30 text-pink-400 rounded-lg hover:bg-pink-500/20 transition-all">
                          Donate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-zinc-600 text-xs font-mono mt-3 flex items-center gap-1">
                <Star size={10} /> Donating to NGOs gives +25 Karma — highest reward
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
