import { useState, useCallback, useRef, useEffect, Fragment } from 'react'
import Calendar from './Calendar'
import ChatBox from './ChatBox'
import Weather from './Weather'
import News from './News'

const WIDGET_DEFS: Record<string, { title: string; component: React.ReactNode }> = {
  calendar: { title: 'Calendar', component: <Calendar /> },
  weather: { title: 'Weather', component: <Weather /> },
  news: { title: 'News', component: <News /> },
}

type DropTarget =
  | { type: 'widget'; colIndex: number; widgetId: string; position: 'before' | 'after' }
  | { type: 'col-end'; colIndex: number }
  | { type: 'new-col'; insertAt: number }

function DashboardLayout() {
  const [chatWidthPercent, setChatWidthPercent] = useState(20)
  const [grid, setGrid] = useState([['news'], ['calendar', 'weather']])
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  const dropTargetRef = useRef<DropTarget | null>(null)
  const dragIdRef = useRef<string | null>(null)
  const gridRef = useRef(grid)

  useEffect(() => { gridRef.current = grid }, [grid])
  useEffect(() => { dropTargetRef.current = dropTarget }, [dropTarget])
  useEffect(() => { dragIdRef.current = dragId }, [dragId])

  const setDrop = (target: DropTarget | null) => {
    setDropTarget(target)
    dropTargetRef.current = target
  }

  function findWidget(id: string) {
    for (let c = 0; c < gridRef.current.length; c++) {
      const r = gridRef.current[c].indexOf(id)
      if (r !== -1) return { colIndex: c, rowIndex: r }
    }
    return null
  }

  const handleTitleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return
    e.preventDefault()

    setDragId(id)
    dragIdRef.current = id
    setDrop(null)

    const draggedEl = document.querySelector(`[data-widget-id="${id}"]`) as HTMLElement

    const onMove = (me: MouseEvent) => {
      draggedEl.style.visibility = 'hidden'
      const el = document.elementFromPoint(me.clientX, me.clientY)
      draggedEl.style.visibility = ''

      const widgetEl = el?.closest('[data-widget-id]') as HTMLElement | null
      const wid = widgetEl?.getAttribute('data-widget-id') ?? null
      const colEl = el?.closest('[data-col-index]') as HTMLElement | null
      const colZone = el?.closest('[data-col-zone]') as HTMLElement | null

      if (wid && wid !== id) {
        const rect = widgetEl!.getBoundingClientRect()
        const position = me.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
        let targetCol = 0
        for (let c = 0; c < gridRef.current.length; c++) {
          if (gridRef.current[c].includes(wid)) { targetCol = c; break }
        }
        setDrop({ type: 'widget', colIndex: targetCol, widgetId: wid, position })
      } else if (colZone) {
        setDrop({ type: 'new-col', insertAt: parseInt(colZone.getAttribute('data-col-zone')!) })
      } else if (colEl) {
        setDrop({ type: 'col-end', colIndex: parseInt(colEl.getAttribute('data-col-index')!) })
      } else {
        setDrop(null)
      }
    }

    const onUp = () => {
      draggedEl.style.visibility = ''
      const target = dropTargetRef.current
      const source = dragIdRef.current

      if (source && target) {
        const src = findWidget(source)
        if (src) {
          const newGrid = gridRef.current.map(col => [...col])
          newGrid[src.colIndex].splice(src.rowIndex, 1)

          if (target.type === 'widget') {
            for (let c = 0; c < newGrid.length; c++) {
              const r = newGrid[c].indexOf(target.widgetId)
              if (r !== -1) {
                newGrid[c].splice(target.position === 'after' ? r + 1 : r, 0, source)
                break
              }
            }
          } else if (target.type === 'col-end') {
            newGrid[target.colIndex].push(source)
          } else {
            newGrid.splice(target.insertAt, 0, [source])
          }

          const cleaned = newGrid.filter(col => col.length > 0)
          setGrid(cleaned)
          gridRef.current = cleaned
        }
      }

      setDragId(null)
      dragIdRef.current = null
      setDrop(null)

      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const isZoneActive = (i: number) => dropTarget?.type === 'new-col' && dropTarget.insertAt === i

  const renderColZone = (i: number) => (
    <div
      data-col-zone={i}
      style={{
        width: isZoneActive(i) ? '40px' : '16px',
        minWidth: '4px',
        background: isZoneActive(i) ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
        border: isZoneActive(i) ? '2px dashed var(--accent)' : '2px dashed transparent',
        borderRadius: '8px',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    />
  )

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', overflowY: 'auto' }}>
        <header style={{ padding: '16px', border: '1px solid #ccc' }}>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
        </header>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0', flex: 1 }}>
          {grid.map((col, colIdx) => (
            <Fragment key={colIdx}>
              {renderColZone(colIdx)}
              <div data-col-index={colIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, padding: '8px 0' }}>
                {col.map((id, rowIdx) => {
                  const def = WIDGET_DEFS[id]
                  const isDragging = dragId === id
                  const isTargetBefore = dropTarget?.type === 'widget' && dropTarget.colIndex === colIdx && dropTarget.widgetId === id && dropTarget.position === 'before'
                  const isTargetAfter = dropTarget?.type === 'widget' && dropTarget.colIndex === colIdx && dropTarget.widgetId === id && dropTarget.position === 'after'
                  const isTargetEndOfCol = rowIdx === col.length - 1 && dropTarget?.type === 'col-end' && dropTarget.colIndex === colIdx

                  return (
                    <div key={id} data-widget-id={id}>
                      {isTargetBefore && <div style={{ height: '3px', background: 'var(--accent)', borderRadius: '2px', marginBottom: '8px' }} />}
                      <div style={{
                        opacity: isDragging ? 0.4 : 1,
                        border: '1px solid #ccc',
                        transition: 'opacity 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                      }}>
                        <div
                          onMouseDown={(e) => handleTitleMouseDown(e, id)}
                          style={{
                            padding: '8px 12px',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            borderBottom: '1px solid #eee',
                            fontWeight: 'bold',
                            background: 'rgba(0,0,0,0.02)',
                          }}
                        >
                          {def.title}
                        </div>
                        <div style={{ padding: '8px', flex: 1, overflow: 'auto' }}>{def.component}</div>
                      </div>
                      {(isTargetAfter || isTargetEndOfCol) && <div style={{ height: '3px', background: 'var(--accent)', borderRadius: '2px', marginTop: '8px' }} />}
                    </div>
                  )
                })}
              </div>
            </Fragment>
          ))}
          {renderColZone(grid.length)}
        </div>
      </div>

      <div style={{ width: `${chatWidthPercent}vw`, flexShrink: 0, position: 'relative' }}>
        <ChatBox widthPercent={chatWidthPercent} onResize={setChatWidthPercent} />
      </div>
    </div>
  )
}

export default DashboardLayout
