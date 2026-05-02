const TIERS = {
  seedling: { label: '🌱 Seedling', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  neighbor: { label: '🌿 Neighbor', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  pillar:   { label: '🌳 Pillar',   color: 'text-teal-400 bg-teal-400/10 border-teal-400/20' },
  guardian: { label: '♻️ Guardian', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
}

export default function KarmaBadge({ tier, karma, showScore = false }) {
  const t = TIERS[tier] || TIERS.seedling
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono ${t.color}`}>
      {t.label}
      {showScore && <span className="opacity-60">· {karma}</span>}
    </span>
  )
}
