export default function Nav({ page, setPage, user, onLogout }) {
  const links = [
    { id: 'home',      label: 'Home' },
    { id: 'browse',    label: 'Browse' },
    { id: 'dashboard', label: 'My Trades' },
    { id: 'matches',   label: 'Matches' },
    { id: 'list',      label: '+ List' },
    { id: 'karma',     label: 'Karma' },
  ]

  return (
    <nav className="el-nav">
      <div className="el-nav-logo" onClick={() => setPage('home')}>
        🌿 Eco<span>Loop</span>
      </div>
      <ul className="el-nav-links">
        {links.map(l => (
          <li key={l.id}>
            <button
              className={page === l.id ? 'active' : ''}
              onClick={() => setPage(l.id)}
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
      {user ? (
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div className="el-nav-karma" onClick={() => setPage('karma')}>
            <span className="k-dot" />
            {user.karma} Karma
          </div>
          <button onClick={onLogout} style={{
            background:'none',border:'none',cursor:'pointer',
            fontSize:13,color:'var(--muted)',fontFamily:"'DM Sans',sans-serif",
            padding:'4px 8px',borderRadius:6,transition:'color .2s',
          }}
            onMouseEnter={e=>e.target.style.color='var(--soil)'}
            onMouseLeave={e=>e.target.style.color='var(--muted)'}
          >sign out</button>
        </div>
      ) : (
        <button className="btn-primary" onClick={() => setPage('login')}
          style={{padding:'7px 18px',fontSize:14}}>
          Sign In
        </button>
      )}
    </nav>
  )
}
