import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reports, sessions } from '../api';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const [a, s] = await Promise.all([
          reports.analytics().then((r) => r.data),
          sessions.list().then((r) => r.data)
        ]);
        setAnalytics(a);
        setRecentSessions(s.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return <p style={{ color: 'var(--textMuted)' }}>Loading dashboard...</p>;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Dashboard</h1>
      <p style={{ color: 'var(--textMuted)', marginBottom: '1.5rem' }}>
        Overview of attendance and recent sessions
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ color: 'var(--textMuted)', fontSize: '0.875rem' }}>Students with records</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{analytics.length}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--textMuted)', fontSize: '0.875rem' }}>Recent sessions</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{recentSessions.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Attendance by student</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Present</th>
                  <th>Total</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {analytics.length === 0 ? (
                  <tr><td colSpan={6} style={{ color: 'var(--textMuted)' }}>No attendance data yet</td></tr>
                ) : (
                  analytics.slice(0, 15).map((row) => (
                    <tr key={row._id}>
                      <td>{row.name}</td>
                      <td>{row.course || '-'}</td>
                      <td>{row.batch}</td>
                      <td>{row.present}</td>
                      <td>{row.total}</td>
                      <td>{typeof row.percentage === 'number' ? row.percentage.toFixed(1) : row.percentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Recent sessions</h2>
            <Link to="/sessions" className="btn btn-secondary">View all</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Date</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.length === 0 ? (
                  <tr><td colSpan={4} style={{ color: 'var(--textMuted)' }}>No sessions yet</td></tr>
                ) : (
                  recentSessions.map((s) => {
                    const link = `${window.location.origin}/attend/${s.slug}`;
                    const closed = new Date() > new Date(s.closesAt);
                    return (
                      <tr key={s._id}>
                        <td>{s.course?.name}</td>
                        <td>{s.batch}</td>
                        <td>{new Date(s.sessionDate).toLocaleString()}</td>
                        <td>
                          {closed ? (
                            <span style={{ color: 'var(--textMuted)' }}>Expired</span>
                          ) : (
                            <a href={link} target="_blank" rel="noopener noreferrer">Open link</a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
