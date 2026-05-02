import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { api } from '../lib/api'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Chat({ matchId, user, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const socketRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    // Load history
    api.chat.history(matchId).then(setMessages).catch(() => {})

    // Connect socket
    const token = localStorage.getItem('ecoloop_token')
    const socket = io(BASE, { auth: { token } })
    socketRef.current = socket

    socket.emit('join_match', matchId)
    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    return () => socket.disconnect()
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    if (!input.trim()) return
    socketRef.current?.emit('send_message', { matchId, body: input.trim() })
    setInput('')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>
      <button onClick={onBack} style={{ marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(130 45% 38%)', fontSize: 14 }}>
        ← Back to Matches
      </button>
      <h2 style={{ fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Match Chat</h2>

      <div style={{ border: '1px solid hsl(130 20% 88%)', borderRadius: 12, height: 420, overflowY: 'auto', padding: 16, background: 'white', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <p style={{ color: 'hsl(130 15% 60%)', fontSize: 13, textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
            No messages yet. Say hi!
          </p>
        )}
        {messages.map(msg => {
          const mine = msg.sender_id === user.id
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontSize: 11, color: 'hsl(130 15% 55%)', marginBottom: 2 }}>{mine ? 'You' : msg.sender_name}</span>
              <div style={{
                background: mine ? 'hsl(130 45% 38%)' : 'hsl(42 30% 94%)',
                color: mine ? 'white' : 'hsl(130 15% 20%)',
                padding: '8px 12px', borderRadius: mine ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                maxWidth: '75%', fontSize: 14, lineHeight: 1.4
              }}>
                {msg.body}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid hsl(130 20% 85%)', fontSize: 14, outline: 'none' }}
        />
        <button onClick={send} style={{ padding: '10px 20px', borderRadius: 10, background: 'hsl(130 45% 38%)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          Send
        </button>
      </div>
    </div>
  )
}
