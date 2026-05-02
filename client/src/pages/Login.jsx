import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

function encodeGeohash(lat, lng, precision = 5) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
  let minLat=-90,maxLat=90,minLng=-180,maxLng=180,hash='',bits=0,bitsTotal=0,hashValue=0
  while (hash.length < precision) {
    if (bitsTotal%2===0) { const mid=(minLng+maxLng)/2; if(lng>=mid){hashValue=(hashValue<<1)+1;minLng=mid}else{hashValue=(hashValue<<1)+0;maxLng=mid} }
    else                 { const mid=(minLat+maxLat)/2; if(lat>=mid){hashValue=(hashValue<<1)+1;minLat=mid}else{hashValue=(hashValue<<1)+0;maxLat=mid} }
    bitsTotal++
    if(++bits===5){hash+=BASE32[hashValue];bits=0;hashValue=0}
  }
  return hash
}

const COUNTRIES = ['India','United States','United Kingdom','Germany','Australia','Canada','Singapore','UAE','Other']
const DEV_MODE  = import.meta.env.VITE_DEV_MODE === 'true'

function Card({ children }) {
  return (
    <div style={{ minHeight:'100svh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img src='/ecoloop_transparent.png' alt='EcoLoop' style={{ height:56, marginBottom:4 }} />
          <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>Trade locally. Earn karma. Skip the money.</div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Login({ onLogin, setPage }) {
  const [step,     setStep]     = useState('entry')  // entry | register | signin | otp
  const [devUsers, setDevUsers] = useState([])

  // register fields
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [name,     setName]     = useState('')
  const [age,      setAge]      = useState('')
  const [city,     setCity]     = useState('')
  const [country,  setCountry]  = useState('India')
  const [geohash,  setGeohash]  = useState('')
  const [locating, setLocating] = useState(false)
  const [locLabel, setLocLabel] = useState('')

  // OTP step
  const [otp,      setOtp]      = useState(['','','','','',''])
  const otpRefs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()]
  const [resendTimer, setResendTimer] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (DEV_MODE) api.auth.devUsers().then(setDevUsers).catch(()=>{})
  }, [])

  // Countdown for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r-1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  function detectLocation() {
    if (!navigator.geolocation) return setLocLabel("Not supported")
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const gh = encodeGeohash(pos.coords.latitude, pos.coords.longitude)
        setGeohash(gh)
        // Reverse geocode to show actual location name
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          const d = await r.json()
          const area = d.address?.suburb || d.address?.neighbourhood || d.address?.city_district || d.address?.city || 'your area'
          const city = d.address?.city || d.address?.town || d.address?.state || ''
          setLocLabel(`${area}${city && area !== city ? ', ' + city : ''}`)
          if (!city) setCity(area)
          else { setCity(area + ', ' + city) }
        } catch {
          setLocLabel('Location detected')
        }
        setLocating(false)
      },
      () => { setLocLabel("Couldn't detect — enter city manually"); setLocating(false) }
    )
  }

  async function handleDevLogin(userId) {
    setLoading(true)
    try { const {token,user} = await api.auth.devLogin(userId); onLogin(token,user) }
    catch(e) { setError(e.message) }
    finally  { setLoading(false) }
  }

  async function handleSendOTP() {
    if (!email || !name)          return setError('Email and name are required')
    if (!password || password.length < 6) return setError('Password must be at least 6 characters')
    if (!email.includes('@'))     return setError('Enter a valid email address')
    setLoading(true); setError('')
    try {
      const res = await api.auth.sendOTP({ email, name, password, age: age ? parseInt(age) : null, city: city||'Unknown', country, geohash: geohash||'tdr1u' })
      // Dev mode with no email configured returns token directly
      if (res.verified && res.token) return onLogin(res.token, res.user)
      setStep('otp')
      setResendTimer(60)
    } catch(e) { setError(e.message) }
    finally    { setLoading(false) }
  }

  async function handleVerifyOTP() {
    const code = otp.join('')
    if (code.length < 6) return setError('Enter the 6-digit code from your email')
    setLoading(true); setError('')
    try {
      const { token, user } = await api.auth.verifyEmail({ email, otp: code })
      onLogin(token, user)
    } catch(e) { setError(e.message) }
    finally    { setLoading(false) }
  }

  async function handleSignIn() {
    if (!email)    return setError('Enter your email')
    if (!password) return setError('Enter your password')
    setLoading(true); setError('')
    try { const {token,user} = await api.auth.login({email,password}); onLogin(token,user) }
    catch(e) { setError(e.message) }
    finally  { setLoading(false) }
  }

  function handleOTPInput(val, idx) {
    const digits = val.replace(/\D/g,'').slice(0,1)
    const next = [...otp]; next[idx] = digits; setOtp(next)
    if (digits && idx < 5) otpRefs[idx+1].current?.focus()
  }

  function handleOTPKeyDown(e, idx) {
    if (e.key==='Backspace' && !otp[idx] && idx>0) { otpRefs[idx-1].current?.focus() }
    if (e.key==='Enter') handleVerifyOTP()
  }

  function handleOTPPaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (text.length===6) { setOtp(text.split('')); otpRefs[5].current?.focus() }
  }

  // ── Dev panel ─────────────────────────────────────────────
  if (DEV_MODE && step==='devpanel') return (
    <Card>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--leaf)', marginBottom:16 }}>⚡ Dev Quick Login</div>
      {devUsers.map(u => (
        <button key={u.id} onClick={()=>handleDevLogin(u.id)} disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:14, width:'100%', padding:'14px 18px', marginBottom:10,
            background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', cursor:'pointer', textAlign:'left' }}>
          <div style={{ fontSize:28 }}>{u.karma_tier==='guardian'?'♻️':u.karma_tier==='pillar'?'🌳':u.karma_tier==='neighbor'?'🌿':'🌱'}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, color:'var(--soil)', fontSize:15 }}>{u.display_name}</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>{u.neighborhood} · {u.karma} karma</div>
          </div>
          <div style={{ fontSize:12, color:'var(--leaf)', fontWeight:600 }}>Login →</div>
        </button>
      ))}
      <button className="btn-outline" style={{ width:'100%', marginTop:8 }} onClick={()=>setStep('entry')}>← Back</button>
    </Card>
  )

  // ── Entry ─────────────────────────────────────────────────
  if (step==='entry') return (
    <Card>
      <div style={{ display:'flex', gap:10, marginBottom:28 }}>
        <button onClick={()=>{setStep('register');setError('')}} className="btn-primary" style={{ flex:1, padding:14, fontSize:15 }}>New here</button>
        <button onClick={()=>{setStep('signin');setError('')}}   className="btn-outline" style={{ flex:1, padding:14, fontSize:15 }}>Sign in</button>
      </div>
      {DEV_MODE && (
        <div style={{ textAlign:'center' }}>
          <button onClick={()=>setStep('devpanel')} style={{ background:'none', border:'none', fontSize:12, color:'var(--muted)', cursor:'pointer' }}>🛠 Dev login</button>
        </div>
      )}
    </Card>
  )

  // ── OTP verification ──────────────────────────────────────
  if (step==='otp') return (
    <Card>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>📬</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--soil)', marginBottom:8 }}>Check your email</h2>
        <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>
          We sent a 6-digit code to<br />
          <strong style={{ color:'var(--soil)' }}>{email}</strong>
        </p>
      </div>

      {/* OTP boxes */}
      <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:20 }}>
        {otp.map((digit, i) => (
          <input key={i} ref={otpRefs[i]}
            type="text" inputMode="numeric" maxLength={1}
            value={digit}
            onChange={e=>handleOTPInput(e.target.value, i)}
            onKeyDown={e=>handleOTPKeyDown(e, i)}
            onPaste={i===0 ? handleOTPPaste : undefined}
            style={{
              width:48, height:56, textAlign:'center', fontSize:24, fontWeight:700,
              border:`2px solid ${digit ? 'hsl(130 45% 38%)' : 'var(--border)'}`,
              borderRadius:12, background:'var(--surface)', color:'var(--soil)',
              outline:'none', transition:'border-color .15s',
            }}
          />
        ))}
      </div>

      {error && <p style={{ color:'#c0392b', fontSize:13, marginBottom:12, textAlign:'center' }}>{error}</p>}

      <button className="el-form-submit" onClick={handleVerifyOTP} disabled={loading || otp.join('').length<6}>
        {loading ? 'Verifying…' : '✓ Verify & Create Account'}
      </button>

      <div style={{ textAlign:'center', marginTop:16 }}>
        {resendTimer > 0 ? (
          <p style={{ fontSize:13, color:'var(--muted)' }}>Resend in {resendTimer}s</p>
        ) : (
          <button onClick={handleSendOTP} disabled={loading}
            style={{ background:'none', border:'none', fontSize:13, color:'var(--leaf)', cursor:'pointer', textDecoration:'underline' }}>
            Resend code
          </button>
        )}
        <button onClick={()=>{setStep('register');setOtp(['','','','','','']);setError('')}}
          style={{ display:'block', margin:'8px auto 0', background:'none', border:'none', fontSize:13, color:'var(--muted)', cursor:'pointer' }}>
          ← Change email
        </button>
      </div>
    </Card>
  )

  // ── Sign in ───────────────────────────────────────────────
  if (step==='signin') return (
    <Card>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--soil)', marginBottom:6 }}>Welcome back</h2>
      <p style={{ fontSize:13, color:'var(--muted)', marginBottom:28 }}>Sign in with your email and password.</p>
      <div className="el-form-group">
        <label>Email</label>
        <input type="email" placeholder="you@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSignIn()} />
      </div>
      <div className="el-form-group">
        <label>Password</label>
        <div style={{ position:'relative' }}>
          <input type={showPass?'text':'password'} placeholder="Your password" value={password}
            onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSignIn()} style={{ paddingRight:40 }} />
          <button type="button" onClick={()=>setShowPass(s=>!s)}
            style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16 }}>
            {showPass?'🙈':'👁️'}
          </button>
        </div>
      </div>
      {error && <p style={{ color:'#c0392b', fontSize:13, marginBottom:12 }}>{error}</p>}
      <button className="el-form-submit" onClick={handleSignIn} disabled={loading}>{loading?'Signing in…':'Sign In →'}</button>
      <button className="btn-outline" style={{ width:'100%', marginTop:10 }} onClick={()=>setStep('entry')}>← Back</button>
    </Card>
  )

  // ── Register ──────────────────────────────────────────────
  return (
    <Card>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--soil)', marginBottom:6 }}>Create your account</h2>
      <p style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>We'll send a quick code to verify your email.</p>

      <div className="el-form-group">
        <label>Gmail / Email *</label>
        <input type="email" placeholder="you@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} />
      </div>
      <div className="el-form-group">
        <label>Password * <span style={{ fontWeight:400, color:'var(--muted)', fontSize:12 }}>(min 6 chars)</span></label>
        <div style={{ position:'relative' }}>
          <input type={showPass?'text':'password'} placeholder="Choose a password" value={password} onChange={e=>setPassword(e.target.value)} style={{ paddingRight:40 }} />
          <button type="button" onClick={()=>setShowPass(s=>!s)}
            style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16 }}>
            {showPass?'🙈':'👁️'}
          </button>
        </div>
      </div>
      <div className="el-form-group">
        <label>Your name *</label>
        <input type="text" placeholder="e.g. Riya, Arjun…" value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="el-form-group">
          <label>Age</label>
          <input type="number" placeholder="22" value={age} min={13} max={120} onChange={e=>setAge(e.target.value)} />
        </div>
        <div className="el-form-group">
          <label>Country</label>
          <select value={country} onChange={e=>setCountry(e.target.value)}>
            {COUNTRIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="el-form-group">
        <label>City / Neighbourhood</label>
        <input type="text" placeholder="e.g. Koramangala, Bangalore" value={city} onChange={e=>setCity(e.target.value)} />
      </div>
      <div className="el-form-group">
        <label>Location <span style={{ fontWeight:400, color:'var(--muted)' }}>(optional)</span></label>
        <button type="button" className="btn-outline" style={{ width:'100%', padding:'10px 16px' }} onClick={detectLocation} disabled={locating}>
          {locating?'📍 Detecting…':geohash?'✅ '+locLabel:'📍 Use my location'}
        </button>
        <p style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>We only store a rough area (±5km), never exact coordinates.</p>
      </div>

      {error && <p style={{ color:'#c0392b', fontSize:13, marginBottom:12 }}>{error}</p>}

      <button className="el-form-submit" onClick={handleSendOTP} disabled={loading||!email||!name||!password}>
        {loading?'Sending code…':'Send verification code →'}
      </button>
      <button className="btn-outline" style={{ width:'100%', marginTop:10 }} onClick={()=>setStep('entry')}>← Back</button>
    </Card>
  )
}
