import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from './lib/api'
import Home      from './pages/Home'
import Dashboard from './pages/Dashboard'
import Browse    from './pages/Browse'
import ListItem  from './pages/ListItem'
import Matches   from './pages/Matches'
import Karma     from './pages/Karma'
import Login     from './pages/Login'
import Chat       from './pages/Chat'
import TradeBoard from './pages/TradeBoard'
import Feed      from './pages/Feed'
import Header    from './components/Header'
import './index.css'

const PROTECTED = ['tradeboard', 'dashboard', 'list', 'matches', 'karma', 'browse', 'chat', 'feed']

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

export default function App() {
  const [page,    setPage]    = useState('home')
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats,   setStats]   = useState({ total_listings: 0, total_users: 0, completed_matches: 0 })
  const [chatMatchId, setChatMatchId] = useState(null)
  const [chatMatchName, setChatMatchName] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('ecoloop_token')
    if (token) {
      api.users.me()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('ecoloop_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    api.stats.get().then(setStats).catch(() => {})
  }, [])

  function handleLogin(token, userData) {
    localStorage.setItem('ecoloop_token', token)
    setUser(userData)
    setPage('home')
    api.stats.get().then(setStats).catch(() => {})
    // Global socket for real-time events across all pages
    if (window.__ecoSocket) window.__ecoSocket.disconnect()
    window.__ecoSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', { auth: { token } })
  }

  function handleLogout() {
    localStorage.removeItem('ecoloop_token')
    setUser(null)
    setPage('home')
  }

  function guardedSetPage(p) {
    if (PROTECTED.includes(p) && !user) setPage('login')
    else setPage(p)
  }

  function openChat(matchId) {
    setChatMatchId(matchId)
    guardedSetPage('chat')
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'hsl(42 30% 97%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg, hsl(130 45% 38%), hsl(135 55% 28%))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🌿</div>
          <span style={{ fontFamily:"'DM Mono', monospace", fontSize:13, color:'hsl(130 15% 48%)' }}>Loading…</span>
        </div>
      </div>
    )
  }

  if (page === 'login') {
    return <Login onLogin={handleLogin} setPage={setPage} />
  }

  const appUser = user ? {
    name:    user.display_name || 'You',
    karma:   user.karma || 0,
    city:    user.neighborhood || 'Your city',
    id:      user.id,
    tier:    user.karma_tier,
    phone:   user.phone,
    geohash: user.geohash,
  } : null

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg, hsl(42 40% 97%) 0%, hsl(135 20% 95%) 50%, hsl(42 35% 96%) 100%)' }}>
      <Header user={appUser} page={page} setPage={guardedSetPage} onLogout={handleLogout} stats={stats} />
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'0 20px 80px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={page} variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {page === 'home'      && <Home      setPage={guardedSetPage} stats={stats} user={appUser} />}
            {page === 'browse'    && appUser && <Browse    setPage={guardedSetPage} user={appUser} />}
            {page === 'dashboard' && appUser && <Dashboard setPage={guardedSetPage} user={appUser} />}
            {page === 'list'      && appUser && <ListItem  setPage={guardedSetPage} user={appUser} />}
            {page === 'matches'   && appUser && <Matches   setPage={guardedSetPage} user={appUser} openChat={openChat} />}
            {page === 'karma'     && appUser && <Karma     user={appUser} />}
            {page === 'tradeboard' && appUser && <TradeBoard user={appUser} setPage={guardedSetPage} openChat={openChat} />}
            {page === 'feed'       && appUser && <Feed       user={appUser} setPage={guardedSetPage} />}
            {page === 'chat'      && appUser && <Chat matchId={chatMatchId} matchName={chatMatchName} user={appUser} onBack={() => guardedSetPage('matches')} />}
            {PROTECTED.includes(page) && !appUser && <Login onLogin={handleLogin} setPage={setPage} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
