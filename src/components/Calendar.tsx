import { useState, useRef, useEffect, useMemo } from 'react'
import {
  listCategories, listEvents, createEvent, deleteEvent, createCategory,
  type CalendarCategory, type CalendarEvent,
} from '../services/calendarApi'

type ViewMode = 'month' | 'day'

type DisplayEvent = CalendarEvent & { color: string }

const UNCATEGORIZED: CalendarCategory = { id: 0, name: 'Uncategorized', color: '#808080' }

/** Compute where a date's cell sits in the month grid (relative to grid top-left). */
function computeCellPosition(date: Date, containerWidth: number) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const dayIndex = firstDayOfWeek + date.getDate() - 1
  const row = Math.floor(dayIndex / 7)
  const col = dayIndex % 7

  const gap = 4
  const labelRowHeight = 20 // day-of-week labels + margin
  const cellSize = (containerWidth - 6 * gap) / 7

  return {
    x: col * (cellSize + gap) + cellSize / 2,
    y: labelRowHeight + gap + row * (cellSize + gap) + cellSize / 2,
    scale: cellSize / containerWidth,
  }
}

const TRANSITION_DURATION = '0.2s'

function Calendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [popupEvent, setPopupEvent] = useState<DisplayEvent | null>(null)
  const [apiEvents, setApiEvents] = useState<CalendarEvent[]>([])
  const [categories, setCategories] = useState<CalendarCategory[]>([UNCATEGORIZED])
  const [addDialog, setAddDialog] = useState<{ open: boolean; startTime: Date } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const viewWrapperRef = useRef<HTMLDivElement>(null)
  const transitioningRef = useRef(false)

  // Derive display events (with color from category)
  const events = useMemo(() => {
    return apiEvents.map(e => ({
      ...e,
      color: categories.find(c => c.id === e.category_id)?.color ?? UNCATEGORIZED.color,
    }))
  }, [apiEvents, categories])

  // Fetch categories on mount
  useEffect(() => {
    listCategories()
      .then(cats => setCategories([UNCATEGORIZED, ...cats]))
      .catch(() => setError('Failed to load categories'))
  }, [])

  // Fetch events when visible month changes
  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const start = new Date(year, month - 1, 1).toISOString()
    const end = new Date(year, month + 2, 0, 23, 59, 59).toISOString()

    setLoading(true)
    setError(null)
    listEvents(start, end)
      .then(setApiEvents)
      .catch(() => setError('Failed to load events'))
      .finally(() => setLoading(false))
  }, [currentDate.getFullYear(), currentDate.getMonth()])

  // ── Symmetric two-phase transition: collapse then expand ──────
  const animateTransition = (
    originX: number,
    originY: number,
    scale: number,
    onSwap: () => void,
  ) => {
    const el = viewWrapperRef.current
    if (!el) return
    transitioningRef.current = true

    // Phase 1: collapse
    el.style.transformOrigin = `${originX}px ${originY}px`
    el.style.transition = `transform ${TRANSITION_DURATION} ease-in`

    const onCollapseEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'transform') return
      el.removeEventListener('transitionend', onCollapseEnd)

      onSwap()

      // Phase 2: expand
      requestAnimationFrame(() => {
        el.style.transition = 'none'
        el.style.transform = `scale(${scale})`

        requestAnimationFrame(() => {
          el.style.transition = `transform ${TRANSITION_DURATION} ease-out`
          el.style.transform = 'scale(1)'

          const onExpandEnd = (ev: TransitionEvent) => {
            if (ev.propertyName !== 'transform') return
            el.removeEventListener('transitionend', onExpandEnd)
            el.style.transition = ''
            el.style.transform = ''
            el.style.transformOrigin = ''
            transitioningRef.current = false
          }
          el.addEventListener('transitionend', onExpandEnd)
        })
      })
    }

    el.addEventListener('transitionend', onCollapseEnd)

    requestAnimationFrame(() => {
      el.style.transform = `scale(${scale})`
    })
  }

  // ── Month → Day (via cell click) — collapse ──────────────────
  const handleDayClick = (date: Date, cellEl: HTMLElement) => {
    if (transitioningRef.current) return
    const parent = viewWrapperRef.current?.parentElement
    if (!parent) return

    const parentRect = parent.getBoundingClientRect()
    if (parentRect.width === 0) { setViewMode('day'); return }

    const cellRect = cellEl.getBoundingClientRect()
    const originX = cellRect.left + cellRect.width / 2 - parentRect.left
    const originY = cellRect.top + cellRect.height / 2 - parentRect.top
    const scale = cellRect.width / parentRect.width

    setSelectedDate(date)
    setCurrentDate(date)

    animateTransition(originX, originY, scale, () => {
      setViewMode('day')
    })
  }

  // ── Toggle button (either direction) ─────────────────────────
  const handleViewModeChange = (newMode: ViewMode) => {
    if (newMode === viewMode || transitioningRef.current) return

    const parent = viewWrapperRef.current?.parentElement
    if (!parent) { setViewMode(newMode); return }

    const parentRect = parent.getBoundingClientRect()
    if (parentRect.width === 0) { setViewMode(newMode); return }

    const pos = computeCellPosition(selectedDate, parentRect.width)

    if (viewMode === 'month' && newMode === 'day') {
      animateTransition(pos.x, pos.y, pos.scale, () => setViewMode('day'))
    } else {
      animateTransition(pos.x, pos.y, pos.scale, () => setViewMode('month'))
    }
  }

  // ── Navigation ───────────────────────────────────────────────
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      const prev = new Date(selectedDate)
      prev.setDate(prev.getDate() - 1)
      setSelectedDate(prev)
      setCurrentDate(prev)
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      const next = new Date(selectedDate)
      next.setDate(next.getDate() + 1)
      setSelectedDate(next)
      setCurrentDate(next)
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  // ── Add / delete events (API) ────────────────────────────────
  const handleDeleteEvent = async (id: number) => {
    try {
      await deleteEvent(id)
      setApiEvents(prev => prev.filter(e => e.id !== id))
      setPopupEvent(null)
    } catch {
      setError('Failed to delete event')
    }
  }

  const handleAddEvent = async (title: string, description: string, startTime: Date, endTime: Date | null, categoryId: number) => {
    try {
      const newEvent = await createEvent({
        title,
        description: description || undefined,
        start_time: startTime.toISOString(),
        end_time: endTime?.toISOString() ?? null,
        category_id: categoryId,
        status: 'scheduled',
      })
      setApiEvents(prev => [...prev, newEvent])
      setAddDialog(null)
    } catch {
      setError('Failed to create event')
    }
  }

  const handleAddCategory = async (name: string, color: string): Promise<number> => {
    try {
      const newCat = await createCategory(name, color)
      setCategories(prev => [...prev, newCat])
      return newCat.id
    } catch {
      setError('Failed to create category')
      return -1
    }
  }

  const handleEmptySlotClick = (time: Date) => {
    setAddDialog({ open: true, startTime: time })
  }

  const headerLabel = viewMode === 'month'
    ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    : selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'long', day: 'numeric' })

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handlePrev}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-h)',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
            }}
          >
            ‹
          </button>
          <button
            onClick={handleToday}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-h)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Today
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-h)',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
            }}
          >
            ›
          </button>
        </div>

        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-h)' }}>
          {headerLabel}
        </div>

        <div style={{
          display: 'flex',
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          {(['month', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              style={{
                padding: '4px 12px',
                border: 'none',
                background: viewMode === mode ? 'var(--accent)' : 'var(--bg)',
                color: viewMode === mode ? '#fff' : 'var(--text)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: viewMode === mode ? 600 : 400,
              }}
            >
              {mode === 'month' ? 'Month' : 'Day'}
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={{ color: '#e53e3e', fontSize: '13px', padding: '0 4px' }}>
          {error}
        </div>
      )}

      {/* Animated view container */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--bg)' }}>
        <div ref={viewWrapperRef} style={{ width: '100%', height: '100%' }}>
          {viewMode === 'month'
            ? <MonthView currentDate={currentDate} events={events} onDayClick={handleDayClick} />
            : <DayView currentDate={selectedDate} events={events} onEventClick={(ev) => setPopupEvent(ev)} onEmptyClick={handleEmptySlotClick} />
          }
        </div>
      </div>

      {/* Event popup */}
      {popupEvent && (
        <div
          onClick={() => setPopupEvent(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
              minWidth: '280px',
              maxWidth: '360px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-h)',
              marginBottom: '12px',
            }}>
              {popupEvent.title}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
              fontSize: '13px',
              color: 'var(--text)',
            }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: popupEvent.color,
                display: 'inline-block',
                flexShrink: 0,
              }} />
              {popupEvent.end_time
                ? `${formatPopupTime(popupEvent.start_time)} – ${formatPopupTime(popupEvent.end_time)}`
                : 'All day'}
            </div>
            {popupEvent.description && (
              <div style={{
                fontSize: '13px',
                color: 'var(--text)',
                lineHeight: 1.5,
                marginBottom: '12px',
              }}>
                {popupEvent.description}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleDeleteEvent(popupEvent.id)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e53e3e',
                  background: 'rgba(229, 62, 62, 0.1)',
                  color: '#e53e3e',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setPopupEvent(null)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-h)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add event dialog */}
      {addDialog?.open && (
        <AddEventDialog
          startTime={addDialog.startTime}
          categories={categories}
          onAdd={handleAddEvent}
          onAddCategory={handleAddCategory}
          onClose={() => setAddDialog(null)}
        />
      )}
    </div>
  )
}

function AddEventDialog({
  startTime,
  categories,
  onAdd,
  onAddCategory,
  onClose,
}: {
  startTime: Date
  categories: CalendarCategory[]
  onAdd: (title: string, description: string, startTime: Date, endTime: Date | null, categoryId: number) => void
  onAddCategory: (name: string, color: string) => Promise<number>
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startStr, setStartStr] = useState(formatDateTimeLocal(startTime))
  const [endStr, setEndStr] = useState(formatDateTimeLocal(new Date(startTime.getTime() + 60 * 60 * 1000)))
  const [categoryId, setCategoryId] = useState(categories.find(c => c.id > 0)?.id ?? 1)
  const [allDay, setAllDay] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6366f1')

  const handleSave = () => {
    if (!title.trim()) return
    const start = new Date(startStr)
    const end = allDay ? null : new Date(endStr)
    onAdd(title.trim(), description.trim(), start, end, categoryId)
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    const newId = await onAddCategory(newCatName.trim(), newCatColor)
    if (newId > 0) {
      setCategoryId(newId)
      setNewCatName('')
      setNewCatColor('#6366f1')
      setShowCategoryForm(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          minWidth: '300px',
          maxWidth: '380px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-h)' }}>
          New Event
        </div>

        <input
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text-h)',
            fontSize: '14px',
          }}
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text-h)',
            fontSize: '13px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text)' }}>
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
          All day
        </label>

        {!allDay && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text)' }}>Start</span>
              <input
                type="datetime-local"
                value={startStr}
                onChange={(e) => setStartStr(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-h)',
                  fontSize: '13px',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text)' }}>End</span>
              <input
                type="datetime-local"
                value={endStr}
                onChange={(e) => setEndStr(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-h)',
                  fontSize: '13px',
                }}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text)' }}>Category</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-h)',
                fontSize: '13px',
              }}
            >
              {categories.filter(c => c.id > 0).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-h)',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
              }}
              title="Add category"
            >
              +
            </button>
          </div>

          {showCategoryForm && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              marginTop: '2px',
            }}>
              <input
                placeholder="Category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-h)',
                  fontSize: '13px',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  style={{
                    width: '32px',
                    height: '28px',
                    padding: '0',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCatName.trim()}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--accent-border)',
                    background: 'var(--accent-bg)',
                    color: 'var(--accent)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: newCatName.trim() ? 'pointer' : 'not-allowed',
                    opacity: newCatName.trim() ? 1 : 0.5,
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--accent-border)',
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontWeight: 600,
              opacity: title.trim() ? 1 : 0.5,
            }}
          >
            Save
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-h)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function MonthView({
  currentDate,
  events,
  onDayClick,
}: {
  currentDate: Date
  events: DisplayEvent[]
  onDayClick: (date: Date, cellEl: HTMLElement) => void
}) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const getEventsForDay = (day: number) =>
    events.filter(e => {
      const d = new Date(e.start_time)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })

  const cells: React.ReactNode[] = []

  // Empty cells before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} style={{ aspectRatio: '1' }} />)
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day)
    const highlighted = isToday(day)

    cells.push(
      <div
        key={day}
        onClick={(e) => onDayClick(new Date(year, month, day), e.currentTarget)}
        style={{
          aspectRatio: '1',
          padding: '3px',
          borderRadius: '6px',
          border: highlighted ? '2px solid var(--accent)' : '1px solid transparent',
          background: highlighted ? 'var(--accent-bg)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          overflow: 'hidden',
        }}
      >
        <div style={{
          fontSize: '12px',
          fontWeight: highlighted ? 700 : 500,
          color: highlighted ? 'var(--accent)' : 'var(--text-h)',
          lineHeight: 1.2,
        }}>
          {day}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, overflow: 'hidden' }}>
          {dayEvents.slice(0, 3).map(ev => (
            <div
              key={ev.id}
              style={{
                fontSize: '9px',
                lineHeight: '13px',
                padding: '0 3px',
                borderRadius: '2px',
                background: ev.color,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {ev.title}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div style={{ fontSize: '9px', color: 'var(--text)', textAlign: 'center' }}>
              +{dayEvents.length - 3}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Day labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '4px',
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(label => (
          <div key={label} style={{
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text)',
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
      }}>
        {cells}
      </div>
    </div>
  )
}

function DayView({
  currentDate,
  events,
  onEventClick,
  onEmptyClick,
}: {
  currentDate: Date
  events: DisplayEvent[]
  onEventClick: (ev: DisplayEvent) => void
  onEmptyClick: (time: Date) => void
}) {
  const dayEvents = events.filter(e => {
    const d = new Date(e.start_time)
    return d.getDate() === currentDate.getDate() &&
           d.getMonth() === currentDate.getMonth() &&
           d.getFullYear() === currentDate.getFullYear()
  })

  const allDayEvents = dayEvents.filter(e => e.end_time === null)
  const timedEvents = dayEvents.filter(e => e.end_time !== null)

  const START_HOUR = 6
  const END_HOUR = 23
  const TOTAL_HOURS = END_HOUR - START_HOUR
  const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

  const formatHour = (h: number) => {
    if (h === 0 || h === 12) return `${h === 0 ? 12 : 12} ${h < 12 ? 'AM' : 'PM'}`
    return h < 12 ? `${h} AM` : `${h - 12} PM`
  }

  const getEventStyle = (ev: DisplayEvent) => {
    const start = new Date(ev.start_time)
    const end = new Date(ev.end_time!)
    const startFrac = start.getHours() + start.getMinutes() / 60
    const endFrac = end.getHours() + end.getMinutes() / 60
    const top = ((startFrac - START_HOUR) / TOTAL_HOURS) * 100
    const height = ((endFrac - startFrac) / TOTAL_HOURS) * 100
    return {
      top: `${Math.max(0, top)}%`,
      height: `${Math.max(height, 3.5)}%`,
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div style={{
          padding: '6px 8px',
          background: 'var(--accent-bg)',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase' }}>
            All Day
          </div>
          {allDayEvents.map(ev => (
            <div
              key={ev.id}
              onClick={() => onEventClick(ev)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: ev.color,
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {ev.title}
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div style={{ display: 'flex', height: '500px' }}>
        {/* Hour labels column */}
        <div style={{ width: '40px', position: 'relative', flexShrink: 0 }}>
          {HOURS.map(h => {
            const top = ((h - START_HOUR) / TOTAL_HOURS) * 100
            return (
              <span key={h} style={{
                position: 'absolute',
                top: `${top}%`,
                right: '4px',
                transform: 'translateY(-50%)',
                fontSize: '10px',
                color: 'var(--text)',
                whiteSpace: 'nowrap',
              }}>
                {formatHour(h)}
              </span>
            )
          })}
        </div>

        {/* Timeline area */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const y = e.clientY - rect.top
            const fraction = y / rect.height
            const totalMinutes = Math.round(fraction * TOTAL_HOURS * 60)
            const hour = START_HOUR + Math.floor(totalMinutes / 60)
            const minute = Math.round((totalMinutes % 60) / 30) * 30
            const clickedTime = new Date(currentDate)
            clickedTime.setHours(hour, minute, 0, 0)
            onEmptyClick(clickedTime)
          }}
          style={{
            flex: 1,
            position: 'relative',
            borderLeft: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          {/* Hour lines */}
          {HOURS.map(h => {
            const top = ((h - START_HOUR) / TOTAL_HOURS) * 100
            return (
              <div key={h} style={{
                position: 'absolute',
                top: `${top}%`,
                left: 0,
                right: 0,
                borderTop: '1px solid var(--border)',
                zIndex: 0,
              }} />
            )
          })}

          {/* Event blocks */}
          {timedEvents.map(ev => {
            const style = getEventStyle(ev)
            return (
              <div
                key={ev.id}
                onClick={() => onEventClick(ev)}
                style={{
                  position: 'absolute',
                  top: style.top,
                  height: style.height,
                  left: '4px',
                  right: '4px',
                  background: ev.color,
                  borderRadius: '4px',
                  padding: '2px 6px',
                  color: '#fff',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  zIndex: 1,
                }}
              >
                <div style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {ev.title}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function formatPopupTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateTimeLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

export default Calendar
