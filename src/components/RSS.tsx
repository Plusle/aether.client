import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  listCategories, createCategory, registerSource,
  listSources, getArticles, updateFeeds,
} from '../services/rssApi';
import type { Source, Article } from '../services/rssApi';

const DEFAULT_FEEDS = [
  { url: 'https://github.blog/feed/', title: 'GitHub Blog' },
  { url: 'https://blog.rust-lang.org/feed.xml', title: 'Rust Blog' },
  { url: 'https://blog.siggraph.org/feed/', title: 'SIGGRAPH Blog' },
];

function RSS() {
  const [sources, setSources] = useState<Source[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [visibleTabs, setVisibleTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const queryArticles = useCallback(async (url: string, catId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArticles(url, catId, 0, 20);
      setArticles(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Init: ensure category + register default feeds + load sources
  useEffect(() => {
    (async () => {
      try {
        // 1. Get or create category
        let cats = await listCategories();
        let catId: number;
        if (cats.length > 0) {
          catId = cats[0].id;
        } else {
          const created = await createCategory('RSS');
          catId = created.id;
        }
        setCategoryId(catId);

        // 2. Register default feeds (re-activates if already exists)
        for (const feed of DEFAULT_FEEDS) {
          try {
            await registerSource(feed.url, feed.title, catId);
          } catch {
            // Ignore — may already be registered
          }
        }

        // 3. Load all sources
        const srcs = await listSources();
        setSources(srcs);

        // 4. Open all as tabs, activate first
        const urls = srcs.map(s => s.url);
        setVisibleTabs(urls);
        if (urls.length > 0) {
          setActiveTab(urls[0]);
          queryArticles(urls[0], catId);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to initialize RSS');
      }
    })();
  }, [queryArticles]);

  const handleTabClick = (url: string) => {
    setActiveTab(url);
    if (categoryId !== null) {
      queryArticles(url, categoryId);
    }
  };

  const handleCloseTab = (url: string) => {
    setVisibleTabs(prev => {
      const next = prev.filter(u => u !== url);
      if (activeTab === url) {
        setActiveTab(next.length > 0 ? next[0] : null);
        if (next.length > 0 && categoryId !== null) {
          queryArticles(next[0], categoryId);
        } else {
          setArticles([]);
        }
      }
      return next;
    });
  };

  const handleToggleVisibility = (url: string) => {
    setVisibleTabs(prev => {
      if (prev.includes(url)) {
        const next = prev.filter(u => u !== url);
        if (activeTab === url) {
          setActiveTab(next.length > 0 ? next[0] : null);
          if (next.length > 0 && categoryId !== null) {
            queryArticles(next[0], categoryId);
          } else {
            setArticles([]);
          }
        }
        return next;
      } else {
        const next = [...prev, url];
        return next;
      }
    });
  };

  const handleAddFeed = async () => {
    if (!newUrl.trim() || !newName.trim() || categoryId === null) return;
    try {
      await registerSource(newUrl.trim(), newName.trim(), categoryId);
      const srcs = await listSources();
      setSources(srcs);
      setVisibleTabs(prev => [...prev, newUrl.trim()]);
      setActiveTab(newUrl.trim());
      queryArticles(newUrl.trim(), categoryId);
      setNewUrl('');
      setNewName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add feed');
    }
  };

  const handleForceUpdate = async () => {
    if (categoryId === null) return;
    setUpdating(true);
    setError(null);
    try {
      await updateFeeds();
      // Refresh sources list (last_fetched_at may have changed)
      const srcs = await listSources();
      setSources(srcs);
      // Re-query articles for active tab
      if (activeTab) {
        await queryArticles(activeTab, categoryId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const getSourceTitle = (url: string) => sources.find(s => s.url === url)?.title ?? url;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap', overflow: 'auto' }}>
        {visibleTabs.map(url => (
          <div
            key={url}
            onClick={() => handleTabClick(url)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px 6px 0 0',
              background: activeTab === url ? 'var(--accent-bg)' : 'transparent',
              border: activeTab === url ? '1px solid var(--accent-border)' : '1px solid transparent',
              borderBottom: activeTab === url ? '1px solid var(--bg)' : '1px solid transparent',
              cursor: 'pointer',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              color: activeTab === url ? 'var(--accent)' : 'var(--text)',
              fontWeight: activeTab === url ? 600 : 400,
            }}
          >
            <span>{getSourceTitle(url)}</span>
            <span
              onClick={(e) => { e.stopPropagation(); handleCloseTab(url); }}
              style={{ cursor: 'pointer', opacity: 0.6, fontSize: '14px', lineHeight: 1 }}
            >
              ×
            </span>
          </div>
        ))}

        {/* Menu button */}
        <div style={{ marginLeft: '4px' }}>
          <button
            ref={menuBtnRef}
            onClick={() => {
              if (!menuOpen && menuBtnRef.current) {
                const rect = menuBtnRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
              }
              setMenuOpen(!menuOpen);
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
            }}
            title="Manage feeds"
          >
            ⋮
          </button>
        </div>

        {/* Dropdown menu via portal */}
        {menuOpen && menuPos && createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuPos.top,
              right: menuPos.right,
              zIndex: 1000,
              minWidth: '240px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow)',
              padding: '8px 0',
            }}
          >
            {/* Feed checkboxes */}
            {sources.map(src => (
              <label
                key={src.url}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-h)',
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleTabs.includes(src.url)}
                  onChange={() => handleToggleVisibility(src.url)}
                />
                {src.title}
              </label>
            ))}

            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />

            {/* Add feed form */}
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>Add Feed</div>
              <input
                placeholder="Feed name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-h)',
                  fontSize: '13px',
                }}
              />
              <input
                placeholder="RSS URL"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-h)',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={handleAddFeed}
                disabled={!newUrl.trim() || !newName.trim()}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--accent-border)',
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: (!newUrl.trim() || !newName.trim()) ? 0.5 : 1,
                }}
              >
                Add
              </button>
            </div>
          </div>,
          document.body,
        )}
      </div>

      {/* Force Update button */}
      <button
        onClick={handleForceUpdate}
        disabled={updating || !activeTab}
        style={{
          padding: '6px 14px',
          borderRadius: '6px',
          border: '1px solid var(--accent-border)',
          background: 'var(--accent-bg)',
          color: 'var(--accent)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: updating ? 'wait' : 'pointer',
          opacity: updating ? 0.6 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {updating ? 'Updating...' : 'Force Update'}
      </button>

      {/* Error */}
      {error && (
        <div style={{ color: '#e53e3e', fontSize: '13px' }}>{error}</div>
      )}

      {/* Articles */}
      {loading ? (
        <div style={{ color: 'var(--text)', fontSize: '14px' }}>Loading articles...</div>
      ) : articles.length > 0 ? (
        <div>
          {articles.map((article, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--text-h)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                {article.title}
              </a>
              {article.description && (
                <div style={{
                  color: 'var(--text)',
                  fontSize: '12px',
                  marginTop: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {stripHtml(article.description)}
                </div>
              )}
              <div style={{ color: 'var(--text)', fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                {formatRelativeTime(article.published_at)}
              </div>
            </div>
          ))}
        </div>
      ) : !loading && activeTab ? (
        <div style={{ color: 'var(--text)', fontSize: '14px' }}>
          No articles yet. Click "Force Update" to fetch.
        </div>
      ) : !activeTab ? (
        <div style={{ color: 'var(--text)', fontSize: '14px' }}>
          No tabs open. Use the ⋮ menu to show feeds.
        </div>
      ) : null}
    </div>
  );
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? '';
}

function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default RSS;
