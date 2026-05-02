const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getToken() { return localStorage.getItem('ecoloop_token') }

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

async function uploadImage(file) {
  const token = getToken()
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

export const api = {
  auth: {
    devUsers:  ()            => request('/api/auth/dev-users'),
    devLogin:  (userId)      => request('/api/auth/dev-login',  { method: 'POST', body: JSON.stringify({ userId }) }),
    register:  (data)        => request('/api/auth/register',   { method: 'POST', body: JSON.stringify(data) }),
    login:     (data)        => request('/api/auth/login',      { method: 'POST', body: JSON.stringify(data) }),
    sendOTP:     (data)  => request('/api/auth/send-otp',      { method: 'POST', body: JSON.stringify(data) }),
    verifyEmail: (data)  => request('/api/auth/verify-email',   { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    me:     ()     => request('/api/users/me'),
    update: (data) => request('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  listings: {
    feed:   (geohash) => request(`/api/listings${geohash ? `?geohash=${geohash}` : ''}`),
    mine:   ()        => request('/api/listings/mine'),
    create: (data)    => request('/api/listings', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id)      => request(`/api/listings/${id}`, { method: 'DELETE' }),
  },
  matches: {
    run:     ()      => request('/api/matches/run', { method: 'POST' }),
    create:  (chain) => request('/api/matches',     { method: 'POST', body: JSON.stringify({ chain }) }),
    mine:    ()      => request('/api/matches/mine'),
    confirm: (id)    => request(`/api/matches/${id}/confirm`, { method: 'POST' }),
    cancel:  (id)    => request(`/api/matches/${id}/cancel`,  { method: 'POST' }),
    phones:  (id)    => request(`/api/matches/${id}/phones`),
  },
  chat: {
    history: (matchId) => request(`/api/chat/${matchId}`),
  },
  trade: {
    listings:        ()                   => request('/api/trade/listings'),
    boards:          ()                   => request('/api/trade/boards'),
    createBoard:     (name)               => request('/api/trade/boards', { method: 'POST', body: JSON.stringify({ name }) }),
    inviteToBoard:   (boardId, phone)     => request(`/api/trade/boards/${boardId}/invite`, { method: 'POST', body: JSON.stringify({ phone }) }),
    boardListings:   (boardId)            => request(`/api/trade/boards/${boardId}/listings`),
    addToBoard:      (boardId, listingId) => request(`/api/trade/boards/${boardId}/listings`, { method: 'POST', body: JSON.stringify({ listing_id: listingId }) }),
  },
  ngos: {
    list:   ()              => request('/api/ngos'),
    donate: (ngoId, wantId) => request(`/api/ngos/${ngoId}/donate`, { method: 'POST', body: JSON.stringify({ wantId }) }),
  },
  food: {
    list:   ()     => request('/api/food'),
    create: (data) => request('/api/food', { method: 'POST', body: JSON.stringify(data) }),
  },
  karma: {
    history:     () => request('/api/karma/history'),
    leaderboard: () => request('/api/karma/leaderboard'),
  },
  wants: {
    list:             ()                                    => request('/api/wants'),
    all:              ()                                    => request('/api/wants/all'),
    create:           (category, description)               => request('/api/wants', { method: 'POST', body: JSON.stringify({ category, description }) }),
    createForListing: (listing_id, category, item_name)     => request('/api/wants', { method: 'POST', body: JSON.stringify({ listing_id, category, item_name }) }),
    remove:           (id)                                  => request(`/api/wants/${id}`, { method: 'DELETE' }),
  },
  stats:  { get: () => fetch(`${BASE}/api/stats`).then(r => r.json()) },
  upload: { image: uploadImage },
  carbon: { blurb: (items) => request('/api/carbon', { method: 'POST', body: JSON.stringify({ items }) }) },
}
