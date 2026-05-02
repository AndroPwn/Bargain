import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

export default function CarbonWidget({ items }) {
  const [blurb,   setBlurb]   = useState('')
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (!items?.length || fetched.current) return
    fetched.current = true
    api.carbon.blurb(items)
      .then(r => setBlurb(r.blurb || ''))
      .catch(() => setBlurb(`Trading ${items.length} item${items.length > 1 ? 's' : ''} saves CO₂ vs buying new. `))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      marginTop: 10,
      padding: '10px 14px',
      background: 'linear-gradient(135deg, hsl(130 50% 95%), hsl(160 40% 93%))',
      border: '1px solid hsl(130 40% 80%)',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.3 }}></span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'hsl(130 45% 38%)', marginBottom: 3 }}>
          Environmental Impact
        </div>
        {loading ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'hsl(130 45% 60%)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'hsl(130 30% 30%)', lineHeight: 1.5, margin: 0 }}>{blurb}</p>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.3}50%{opacity:1} }`}</style>
    </div>
  )
}
