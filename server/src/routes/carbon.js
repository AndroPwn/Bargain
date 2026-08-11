import { Router } from 'express'

const router = Router()

// No auth required — purely an AI text call, no user data involved
router.post('/', async (req, res) => {
  const { items } = req.body
  if (!items || !items.length) return res.status(400).json({ error: 'items required' })

  const itemList = items.filter(Boolean).join(', ')
  const prompt = `In under 50 words, what CO2 (kg) and energy (MJ) is saved by trading/reusing these items instead of buying new: ${itemList}? Give real numbers. Be concise and positive.`

  try {
    if (!process.env.NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY is not configured')

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        max_tokens: 120,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) throw new Error(`NVIDIA ${response.status}`)
    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content?.trim() || ''
    res.json({ blurb: text, source: 'ai' })
  } catch (err) {
    const count  = items.length
    const co2    = (count * 2.4).toFixed(1)
    const energy = (count * 18).toFixed(0)
    res.json({ blurb: `Trading ${count} item${count > 1 ? 's' : ''} saves ~${co2}kg CO₂ and ~${energy}MJ of energy — equivalent to ${Math.round(energy / 10)} hours of TV! 🌿`, source: 'fallback' })
  }
})

export default router
