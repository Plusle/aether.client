import { useState, useCallback } from 'react'

interface ChatBoxProps {
  widthPercent: number
  onResize: (percent: number) => void
}

function ChatBox({ widthPercent, onResize }: ChatBoxProps) {
  const [resizing, setResizing] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(true)

    const startX = e.clientX
    const viewportWidth = window.innerWidth
    const startPercent = widthPercent

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX
      const deltaPercent = (delta / viewportWidth) * 100
      const newPercent = Math.max(10, Math.min(50, startPercent + deltaPercent))
      onResize(newPercent)
    }

    const handleMouseUp = () => {
      setResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [widthPercent, onResize])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '6px',
          cursor: 'col-resize',
          zIndex: 10,
          background: resizing ? 'var(--accent)' : 'transparent',
          transition: 'background 0.15s',
        }}
      />
      <div style={{ padding: '12px', borderBottom: '1px solid #ccc' }}>
        <strong>Chat</strong>
      </div>
      <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <p style={{ color: '#888', fontSize: '14px' }}>No messages yet.</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid #ccc' }}>
        <input
          type="text"
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button style={{ padding: '8px 16px' }}>Send</button>
      </div>
    </div>
  )
}

export default ChatBox