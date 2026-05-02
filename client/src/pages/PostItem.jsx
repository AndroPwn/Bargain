import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { Check, Upload, X, Image } from 'lucide-react'

const CATEGORIES    = ['clothes', 'books', 'electronics', 'food', 'other']
const CONDITIONS    = ['new', 'good', 'fair']
const NEIGHBORHOODS = [
  { label: 'Koramangala', geohash: 'tdr1u' },
  { label: 'HSR Layout',  geohash: 'tdr1g' },
  { label: 'Indiranagar', geohash: 'tdr1v' },
  { label: 'Bellandur',   geohash: 'tdr1t' },
  { label: 'Whitefield',  geohash: 'tdr3h' },
  { label: 'Jayanagar',   geohash: 'tdr1q' },
]

export default function PostItem() {
  const navigate  = useNavigate()
  const fileInput = useRef(null)

  const [form, setForm] = useState({
    title: '', description: '', category: 'clothes', condition: 'good',
    neighborhood: NEIGHBORHOODS[0].label, geohash: NEIGHBORHOODS[0].geohash,
  })
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading]     = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [done, setDone]               = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function pickNeighborhood(label) {
    const n = NEIGHBORHOODS.find(n => n.label === label)
    setForm(f => ({ ...f, neighborhood: label, geohash: n?.geohash || 'tdr1u' }))
  }

  function onFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    fileInput.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let image_url = null
      if (imageFile) {
        setUploading(true)
        image_url = await api.upload.image(imageFile)
        setUploading(false)
      }
      await api.listings.create({ ...form, image_url })
      setDone(true)
      setTimeout(() => navigate('/'), 1500)
    } catch (e) {
      setError(e.message)
      setUploading(false)
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center pulse-green">
        <Check size={24} className="text-green-400" />
      </div>
      <p className="font-mono text-green-400 font-bold">Item posted!</p>
      <p className="text-zinc-500 text-sm font-mono">Returning to feed…</p>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      <h2 className="font-mono text-white font-bold text-lg mb-1">Post an Item</h2>
      <p className="text-zinc-500 text-xs font-mono mb-5">List what you have. EcoLoop finds the exchange.</p>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Image upload */}
        <div>
          <label className="text-zinc-400 text-xs font-mono mb-1.5 block">PHOTO</label>
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
              <img src={imagePreview} alt="preview" className="w-full h-52 object-cover" />
              <button type="button" onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 bg-zinc-950/80 rounded-full flex items-center justify-center
                           text-zinc-400 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInput.current.click()}
              className="w-full h-36 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50
                         flex flex-col items-center justify-center gap-2
                         hover:border-zinc-500 hover:bg-zinc-900 transition-all">
              <Image size={24} className="text-zinc-600" />
              <span className="text-zinc-500 text-xs font-mono">Click to upload photo</span>
              <span className="text-zinc-600 text-xs font-mono">Max 5MB</span>
            </button>
          )}
          <input ref={fileInput} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        </div>

        {/* Title */}
        <div>
          <label className="text-zinc-400 text-xs font-mono mb-1.5 block">ITEM TITLE</label>
          <input required value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Denim Jacket (Size M)"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm
                       placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 transition-colors" />
        </div>

        {/* Description */}
        <div>
          <label className="text-zinc-400 text-xs font-mono mb-1.5 block">DESCRIPTION <span className="text-zinc-600">(optional)</span></label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Size, brand, any details…" rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm
                       placeholder:text-zinc-600 resize-none focus:outline-none focus:border-green-500/50 transition-colors" />
        </div>

        {/* Category */}
        <div>
          <label className="text-zinc-400 text-xs font-mono mb-1.5 block">CATEGORY</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => set('category', c)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono capitalize transition-all
                  ${form.category === c ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="text-zinc-400 text-xs font-mono mb-1.5 block">CONDITION</label>
          <div className="flex gap-2">
            {CONDITIONS.map(c => (
              <button key={c} type="button" onClick={() => set('condition', c)}
                className={`flex-1 py-2 rounded-lg border text-xs font-mono capitalize transition-all
                  ${form.condition === c ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Neighborhood */}
        <div>
          <label className="text-zinc-400 text-xs font-mono mb-1.5 block">YOUR AREA</label>
          <select value={form.neighborhood} onChange={e => pickNeighborhood(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm
                       focus:outline-none focus:border-green-500/50 transition-colors appearance-none">
            {NEIGHBORHOODS.map(n => <option key={n.geohash} value={n.label}>{n.label}</option>)}
          </select>
          <p className="text-zinc-600 text-xs font-mono mt-1">Location blurred to neighbourhood — never exact</p>
        </div>

        {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

        <button type="submit" disabled={loading || !form.title}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-mono font-bold py-3 rounded-lg transition-colors">
          {uploading ? 'Uploading photo…' : loading ? 'Posting…' : 'Post Item'}
        </button>
      </form>
    </div>
  )
}
