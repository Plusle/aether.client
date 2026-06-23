function Calendar() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  // First day of the month (0 = Sunday)
  const firstDay = new Date(year, month, 1).getDay()
  // Number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now.getDate()

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const cells: React.ReactNode[] = []

  // Empty cells before the 1st of the month
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />)
  }

  // Actual day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today
    cells.push(
      <div key={day} style={{ fontWeight: isToday ? 'bold' : undefined }}>
        {day}
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        {monthNames[month]} {year}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
        {dayLabels.map((label) => (
          <div key={label} style={{ fontWeight: 'bold' }}>{label}</div>
        ))}
        {cells}
      </div>
    </div>
  )
}

export default Calendar
