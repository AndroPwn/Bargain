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

// Configuration & Animation Constants
const PROTECTED = ['tradeboard', 'dashboard', 'list', 'matches', 'karma', 'browse', 'chat', 'feed'][cite: 1]

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.215, 0.610, 0.355, 1.000] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
}[cite: 1]

// Cozy & Professional Theme Configuration
const theme = {
  background: 'linear-gradient(180deg, hsl(36 35% 97%) 0%, hsl(36 20% 95%) 100%)',
  textPrimary: 'hsl(24 15% 15%)',
  textMuted: 'hsl(24 10% 45%)',
  loaderBg: 'hsl(36 35% 97%)',
  brandIconBg: 'linear-gradient(135deg, hsl(145 20% 28%), hsl(145 25% 20%))',
  layoutMaxWidth: 1100,
}

export default function App() {
  const [page,    setPage]    = useState('home')[cite: 1]
  const [user,    setUser]    = useState(null)[cite: 1]
  const [loading, setLoading] = useState(true)[cite: 1]
  const [stats,   setStats]   = useState({ total_listings: 0, total_users: 0, completed_matches: 0 })[cite: 1]
  const [chatMatchId, setChatMatchId] = useState(null)[cite: 1]
  const [chatMatchName, setChatMatchName] = useState('')[cite: 1]

  useEffect(() => {
    const token = localStorage.getItem('ecoloop_token')[cite: 1]
    if (token) {
      api.users.me()[cite: 1]
        .then(u => setUser(u))[cite: 1]
        .catch(() => localStorage.removeItem('ecoloop_token'))[cite: 1]
        .finally(() => setLoading(false))[cite: 1]
    } else {
      setLoading(false)[cite: 1]
    }
    api.stats.get().then(setStats).catch(() => {})[cite: 1]
  }, [])

  function handleLogin(token, userData) {
    localStorage.setItem('ecoloop_token', token)[cite: 1]
    setUser(userData)[cite: 1]
    setPage('home')[cite: 1]
    api.stats.get().then(setStats).catch(() => {})[cite: 1]
    
    if (window.__ecoSocket) window.__ecoSocket.disconnect()[cite: 1]
    window.__ecoSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', { auth: { token } })[cite: 1]
  }

  function handleLogout() {
    localStorage.removeItem('ecoloop_token')[cite: 1]
    setUser(null)[cite: 1]
    setPage('home')[cite: 1]
  }

  function guardedSetPage(p) {
    if (PROTECTED.includes(p) && !user) setPage('login')[cite: 1]
    else setPage(p)[cite: 1]
  }

  function openChat(matchId) {
    setChatMatchId(matchId)[cite: 1]
    guardedSetPage('chat')[cite: 1]
  }

  // Elegant, Muted Loading Screen
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.loaderBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 52, 
            height: 52, 
            borderRadius: 16, 
            background: theme.brandIconBg, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: 24,
            boxShadow: '0 8px 24px hsla(145, 25%, 10%, 0.08)'
          }}>
            🌿
          </div>
          <span style={{ 
            fontFamily: "var(--font-mono, 'DM Mono', monospace)", 
            fontSize: 12, 
            letterSpacing: '0.05em', 
            color: theme.textMuted,
            fontWeight: 500
          }}>
            CONNECTING TO ECOLOOP…
          </span>
        </div>
      </div>
    )[cite: 1]
  }

  if (page === 'login') {
    return <Login onLogin={handleLogin} setPage={setPage} />[cite: 1]
  }

  // Normalized Profile Data Mapping
  const appUser = user ? {
    name:    user.display_name || 'You',[cite: 1]
    karma:   user.karma || 0,[cite: 1]
    city:    user.neighborhood || 'Your city',[cite: 1]
    id:      user.id,[cite: 1]
    tier:    user.karma_tier,[cite: 1]
    phone:   user.phone,[cite: 1]
    geohash: user.geohash,[cite: 1]
  } : null[cite: 1]

  return (
    <div style={{ minHeight: '100vh', background: theme.background, color: theme.textPrimary, antialiased: 'true' }}>
      <Header user={appUser} page={page} setPage={guardedSetPage} onLogout={handleLogout} stats={stats} />[cite: 1]
      
      <main style={{ maxWidth: theme.layoutMaxWidth, margin: '0 auto', padding: '0 24px 96px' }}>
        <AnimatePresence mode="wait">[cite: 1]
          <motion.div key={page} variants={pageVariants} initial="initial" animate="animate" exit="exit">[cite: 1]
            {page === 'home'      && <Home      setPage={guardedSetPage} stats={stats} user={appUser} />}[cite: 1]
            {page === 'browse'    && appUser && <Browse    setPage={guardedSetPage} user={appUser} />}[cite: 1]
            {page === 'dashboard' && appUser && <Dashboard setPage={guardedSetPage} user={appUser} />}[cite: 1]
            {page === 'list'      && appUser && <ListItem  setPage={guardedSetPage} user={appUser} />}[cite: 1]
            {page === 'matches'   && appUser && <Matches   setPage={guardedSetPage} user={appUser} openChat={openChat} />}[cite: 1]
            {page === 'karma'     && appUser && <Karma     user={appUser} />}[cite: 1]
            {page === 'tradeboard' && appUser && <TradeBoard user={appUser} setPage={guardedSetPage} openChat={openChat} />}[cite: 1]
            {page === 'feed'       && appUser && <Feed       user={appUser} setPage={guardedSetPage} />}[cite: 1]
            {page === 'chat'      && appUser && <Chat matchId={chatMatchId} matchName={chatMatchName} user={appUser} onBack={() => guardedSetPage('matches')} />}[cite: 1]
            {PROTECTED.includes(page) && !appUser && <Login onLogin={handleLogin} setPage={setPage} />}[cite: 1]
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
