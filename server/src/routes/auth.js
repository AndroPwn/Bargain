import { Router }   from 'express'
import jwt          from 'jsonwebtoken'
import bcrypt       from 'bcrypt'
import nodemailer   from 'nodemailer'
import pool         from '../db/pool.js'

const router     = Router()
const SALT       = 10
// In-memory OTP store: email -> { otp, expires, data }
// Fine for single-server; survives restarts by just re-sending
const pendingOTPs = new Map()

// ── Email transport ──────────────────────────────────────────
function getMailer() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,   // Gmail App Password (not your real password)
    },
  })
}

async function sendOTPEmail(toEmail, otp, name) {
  const mailer = getMailer()
  await mailer.sendMail({
    from: `"EcoLoop 🌿" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your EcoLoop verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#3a7d44">🌿 EcoLoop</h2>
        <p>Hey ${name || 'there'},</p>
        <p>Your verification code is:</p>
        <div style="font-size:40px;font-weight:700;letter-spacing:12px;color:#3a7d44;padding:24px;background:#f0f7f1;border-radius:12px;text-align:center;margin:24px 0">
          ${otp}
        </div>
        <p style="color:#888;font-size:13px">Expires in 10 minutes. If you didn't sign up, ignore this.</p>
      </div>
    `,
  })
}

function makeToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, name: user.display_name },
    process.env.JWT_SECRET || 'dev_secret_change_in_prod',
    { expiresIn: '7d' }
  )
}

// ── Dev helpers ──────────────────────────────────────────────
router.get('/dev-users', async (req, res) => {
  if (process.env.DEV_MODE !== 'true') return res.status(403).json({ error: 'Not in dev mode' })
  const { rows } = await pool.query(
    'SELECT id, display_name, karma, karma_tier, neighborhood FROM users WHERE is_dev_user = TRUE ORDER BY karma DESC'
  )
  res.json(rows)
})

router.post('/dev-login', async (req, res) => {
  if (process.env.DEV_MODE !== 'true') return res.status(403).json({ error: 'Not in dev mode' })
  const { userId } = req.body
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
  if (!rows.length) return res.status(404).json({ error: 'User not found' })
  res.json({ token: makeToken(rows[0]), user: rows[0] })
})

// ── POST /api/auth/send-otp ──────────────────────────────────
// Step 1 of registration: validate data, send email OTP
router.post('/send-otp', async (req, res) => {
  const { email, name, password, age, city, country, geohash } = req.body

  if (!email || !name)           return res.status(400).json({ error: 'Email and name are required' })
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  if (!email.includes('@'))      return res.status(400).json({ error: 'Invalid email address' })

  // Check if already registered
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length) return res.status(409).json({ error: 'An account already exists with this email. Please sign in.' })

  // Check email service is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // If no email configured, skip verification and just register (dev fallback)
    if (process.env.DEV_MODE === 'true') {
      const password_hash = await bcrypt.hash(password, SALT)
      const { rows } = await pool.query(
        `INSERT INTO users (phone, email, display_name, password_hash, age, neighborhood, country, geohash, email_verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE) RETURNING *`,
        [email, email, name, password_hash, age||null, city||'Unknown', country||'IN', geohash||'tdr1u']
      )
      return res.json({ token: makeToken(rows[0]), user: rows[0], verified: true })
    }
    return res.status(503).json({ error: 'Email service not configured on server.' })
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const expires = Date.now() + 10 * 60 * 1000   // 10 minutes

  // Store pending registration
  pendingOTPs.set(email.toLowerCase(), { otp, expires, data: { email, name, password, age, city, country, geohash } })

  try {
    await sendOTPEmail(email, otp, name)
    res.json({ ok: true, message: 'Verification code sent to ' + email })
  } catch (e) {
    console.error('[auth] Email send failed:', e.message)
    res.status(500).json({ error: 'Failed to send email. Check EMAIL_USER and EMAIL_PASS in .env' })
  }
})

// ── POST /api/auth/verify-email ─────────────────────────────
// Step 2: verify OTP → create account → return JWT
router.post('/verify-email', async (req, res) => {
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ error: 'Email and code required' })

  const pending = pendingOTPs.get(email.toLowerCase())
  if (!pending)            return res.status(400).json({ error: 'No pending registration for this email. Please start again.' })
  if (Date.now() > pending.expires) {
    pendingOTPs.delete(email.toLowerCase())
    return res.status(400).json({ error: 'Code expired. Please register again.' })
  }
  if (pending.otp !== String(otp).trim()) {
    return res.status(400).json({ error: 'Incorrect code. Check your email and try again.' })
  }

  // OTP correct — create account
  pendingOTPs.delete(email.toLowerCase())
  const { email: em, name, password, age, city, country, geohash } = pending.data

  try {
    const password_hash = await bcrypt.hash(password, SALT)
    const { rows } = await pool.query(
      `INSERT INTO users (phone, email, display_name, password_hash, age, neighborhood, country, geohash, email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE) RETURNING *`,
      [em, em, name, password_hash, age||null, city||'Unknown', country||'IN', geohash||'tdr1u']
    )
    res.json({ token: makeToken(rows[0]), user: rows[0] })
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Account already exists.' })
    res.status(500).json({ error: e.message })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email)    return res.status(400).json({ error: 'Email required' })
  if (!password) return res.status(400).json({ error: 'Password required' })

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  if (!rows.length) return res.status(404).json({ error: 'No account found with this email.' })

  const user = rows[0]
  if (!user.password_hash) {
    if (process.env.DEV_MODE === 'true') return res.json({ token: makeToken(user), user })
    return res.status(401).json({ error: 'No password set. Please register again.' })
  }

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) return res.status(401).json({ error: 'Incorrect password.' })

  res.json({ token: makeToken(user), user })
})

// ── POST /api/auth/register (legacy / direct — kept for dev) ─
router.post('/register', async (req, res) => {
  const { email, name, password, age, city, country, geohash } = req.body
  if (!email || !name || !password) return res.status(400).json({ error: 'Email, name, password required' })
  const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email])
  if (existing.rows.length) return res.status(409).json({ error: 'Account already exists with this email.' })
  try {
    const password_hash = await bcrypt.hash(password, SALT)
    const { rows } = await pool.query(
      `INSERT INTO users (phone,email,display_name,password_hash,age,neighborhood,country,geohash,email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE) RETURNING *`,
      [email,email,name,password_hash,age||null,city||'Unknown',country||'IN',geohash||'tdr1u']
    )
    res.json({ token: makeToken(rows[0]), user: rows[0] })
  } catch(e) {
    if (e.code==='23505') return res.status(409).json({ error: 'Account already exists.' })
    res.status(500).json({ error: e.message })
  }
})

export default router
