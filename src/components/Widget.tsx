interface WidgetProps {
  title: string
  children: React.ReactNode
}

function Widget({ title, children }: WidgetProps) {
  return (
    <div style={{
      border: '1px solid #ccc',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      <div
        draggable
        style={{
          padding: '8px 12px',
          cursor: 'grab',
          userSelect: 'none',
          borderBottom: '1px solid #eee',
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.02)',
        }}
      >
        {title}
      </div>
      <div style={{ padding: '8px', flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

export default Widget
