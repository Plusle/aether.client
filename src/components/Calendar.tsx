import { useState } from 'react'

type ViewMode = 'month' | 'day'

interface DummyEvent {
  id: number
  title: string
  start_time: string
  end_time: string | null
  category_id: number
  color: string
  description?: string
}

const CATEGORIES = [
  { id: 0, name: 'Uncategorized', color: '#808080' },
  { id: 1, name: 'Work', color: '#3b82f6' },
  { id: 2, name: 'Personal', color: '#10b981' },
  { id: 3, name: 'Important', color: '#ef4444' },
]

function generateDummyEvents(): DummyEvent[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  return [
    { id: 1, title: 'Team Standup', start_time: new Date(y, m, d, 10, 0).toISOString(), end_time: new Date(y, m, d, 10, 30).toISOString(), category_id: 1, color: '#3b82f6', description: 'Daily sync with the team to discuss progress and blockers.' },
    { id: 2, title: 'Lunch with Alex', start_time: new Date(y, m, d, 12, 30).toISOString(), end_time: new Date(y, m, d, 13, 30).toISOString(), category_id: 2, color: '#10b981', description: 'Catch up over lunch at the new ramen place downtown.' },
    { id: 3, title: 'Code Review', start_time: new Date(y, m, d, 15, 0).toISOString(), end_time: new Date(y, m, d, 16, 0).toISOString(), category_id: 1, color: '#3b82f6', description: 'Review the new feature branch for the calendar component.' },
    { id: 4, title: 'Project Deadline', start_time: new Date(y, m, d + 3, 0, 0).toISOString(), end_time: null, category_id: 3, color: '#ef4444', description: 'Final submission deadline for Q2 deliverables.' },
    { id: 5, title: 'Gym', start_time: new Date(y, m, d + 1, 18, 0).toISOString(), end_time: new Date(y, m, d + 1, 19, 0).toISOString(), category_id: 2, color: '#10b981', description: 'Leg day workout session.' },
    { id: 6, title: 'Doctor Appointment', start_time: new Date(y, m, d + 5, 11, 0).toISOString(), end_time: new Date(y, m, d + 5, 11, 30).toISOString(), category_id: 3, color: '#ef4444', description: 'Annual checkup at City Clinic, Room 204.' },
    { id: 7, title: 'Design Sprint', start_time: new Date(y, m, d - 2, 9, 0).toISOString(), end_time: new Date(y, m, d - 2, 17, 0).toISOString(), category_id: 1, color: '#3b82f6', description: 'Full-day design sprint for the new dashboard layout.' },
    { id: 8, title: 'Yoga Class', start_time: new Date(y, m, d + 2, 7, 0).toISOString(), end_time: new Date(y, m, d + 2, 8, 0).toISOString(), category_id: 2, color: '#10b981', description: 'Morning yoga class at the community center.' },
  ]
}

function Calendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [popupEvent, setPopupEvent] = useState<DummyEvent | null>(null)
  const events = generateDummyEvents()

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

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setCurrentDate(date)
    setViewMode('day')
  }

  const headerLabel = viewMode === 'month'
    ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    : selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'long', day: 'numeric' })

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              onClick={() => setViewMode(mode)}
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

      {/* View content */}
      {viewMode === 'month'
        ? <MonthView currentDate={currentDate} events={events} onDayClick={handleDayClick} />
        : <DayView currentDate={selectedDate} events={events} onEventClick={(ev) => setPopupEvent(ev)} />
      }

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
            <button
              onClick={() => setPopupEvent(null)}
              style={{
                width: '100%',
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
      )}
    </div>
  )
}

function MonthView({
  currentDate,
  events,
  onDayClick,
}: {
  currentDate: Date
  events: DummyEvent[]
  onDayClick: (date: Date) => void
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
        onClick={() => onDayClick(new Date(year, month, day))}
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
}: {
  currentDate: Date
  events: DummyEvent[]
  onEventClick: (ev: DummyEvent) => void
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

  const getEventStyle = (ev: DummyEvent) => {
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
        <div style={{
          flex: 1,
          position: 'relative',
          borderLeft: '1px solid var(--border)',
        }}>
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

export default Calendar
