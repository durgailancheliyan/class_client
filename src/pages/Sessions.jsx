import { useState, useEffect } from 'react';
import { sessions, courses } from '../api';

const user = JSON.parse(localStorage.getItem('user') || '{}');
const isTrainer = user.role === 'trainer';

export default function Sessions() {
  const [list, setList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ course: '', batch: '' });
  const [copySlug, setCopySlug] = useState(null);

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        sessions.list().then((r) => r.data),
        courses.list().then((r) => r.data)
      ]);
      setList(s);
      setCourseList(c);
      if (c.length && !form.course) setForm((f) => ({ ...f, course: c[0]._id }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createSession = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const { data } = await sessions.create(form.course, form.batch);
      const link = `${window.location.origin}/attend/${data.slug}`;
      await navigator.clipboard.writeText(link);
      setCopySlug(data.slug);
      setList((prev) => [{ ...data, link }, ...prev]);
      setTimeout(() => setCopySlug(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (slug) => {
    const link = `${window.location.origin}/attend/${slug}`;
    navigator.clipboard.writeText(link);
    setCopySlug(slug);
    setTimeout(() => setCopySlug(null), 2000);
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Attendance Sessions</h1>
      <p style={{ color: 'var(--textMuted)', marginBottom: '1.5rem' }}>
        {isTrainer
          ? 'Create a 2-minute attendance link (only between 9 AM – 6 PM). Share the link with students so they can mark present/absent. Students must be in the same course and batch (from the Students list) to see the form.'
          : 'Only trainers can create attendance links. You can view recent sessions below.'}
      </p>

      {isTrainer && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Create new session</h2>
          <form onSubmit={createSession} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
              <label>Course</label>
              <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required>
                {courseList.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
              <label>Batch</label>
              <input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="e.g. Batch 1" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create & copy link'}
            </button>
          </form>
          {error && <p style={{ color: 'var(--danger)', marginTop: '0.75rem' }}>{error}</p>}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <h2 style={{ padding: '1rem', fontSize: '1.1rem' }}>Recent sessions</h2>
        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--textMuted)' }}>Loading...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Opens</th>
                  <th>Closes</th>
                  <th>Status</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const now = new Date();
                  const open = now >= new Date(s.opensAt) && now <= new Date(s.closesAt);
                  const expired = now > new Date(s.closesAt);
                  return (
                    <tr key={s._id}>
                      <td>{s.course?.name}</td>
                      <td>{s.batch}</td>
                      <td>{new Date(s.opensAt).toLocaleTimeString()}</td>
                      <td>{new Date(s.closesAt).toLocaleTimeString()}</td>
                      <td>
                        {expired ? <span className="badge badge-absent">Expired</span> : open ? <span className="badge badge-present">Open</span> : <span className="badge badge-pending">Scheduled</span>}
                      </td>
                      <td>
                        {!expired && (
                          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => copyLink(s.slug)}>
                            {copySlug === s.slug ? 'Copied!' : 'Copy link'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && list.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--textMuted)' }}>No sessions yet. Create one above.</p>
        )}
      </div>
    </div>
  );
}
