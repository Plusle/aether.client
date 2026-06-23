const dummyNews = [
  { id: 1, title: 'Market hits record high amid tech rally', time: '10 min ago' },
  { id: 2, title: 'New framework release promises 2x performance', time: '1 hour ago' },
  { id: 3, title: 'Global climate summit reaches new agreement', time: '3 hours ago' },
  { id: 4, title: 'Startup raises $50M in Series B funding', time: '5 hours ago' },
  { id: 5, title: 'Researchers discover new optimization technique', time: '8 hours ago' },
]

function News() {
  return (
    <div style={{ padding: '16px' }}>
      {dummyNews.map((item) => (
        <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
          <div>{item.title}</div>
          <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>{item.time}</div>
        </div>
      ))}
    </div>
  )
}

export default News
