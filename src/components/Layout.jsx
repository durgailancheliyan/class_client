import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';

const nav = [
  { path: '/', label: 'Dashboard' },
  { path: '/students', label: 'Students' },
  { path: '/sessions', label: 'Attendance Sessions' },
  { path: '/reports', label: 'Reports' }
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.5rem' }}
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            ☰
          </button>
          <Link to="/" style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text)' }}>
            Course Attendance
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--textMuted)', fontSize: '0.875rem' }}>
            {user.name} ({user.role})
          </span>
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        <aside style={{
          width: open ? 220 : 0,
          overflow: 'hidden',
          transition: 'width 0.2s',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          flexShrink: 0
        }}>
          <nav style={{ padding: '1rem 0' }}>
            {nav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'block',
                  padding: '0.65rem 1.25rem',
                  color: location.pathname === item.path ? 'var(--accent)' : 'var(--textMuted)',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  borderLeft: location.pathname === item.path ? '3px solid var(--accent)' : '3px solid transparent'
                }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
