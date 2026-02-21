import { useState, useEffect } from 'react';
import { courses, reports, students } from '../api';

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

export default function StudentGrid() {
  const [courseList, setCourseList] = useState([]);
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [scoreValue, setScoreValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    courses.list().then((r) => {
      setCourseList(r.data);
      if (r.data.length && !course) setCourse(r.data[0]._id);
    });
  }, []);

  const loadGrid = async () => {
    if (!course || !batch.trim()) {
      setError('Select course and enter batch.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data: res } = await reports.studentsGrid({ course, batch: batch.trim(), year });
      setData(res);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load grid.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const saveMockScore = async (studentId) => {
    const val = scoreValue.trim() === '' ? null : parseInt(scoreValue, 10);
    if (val !== null && (Number.isNaN(val) || val < 0 || val > 100)) {
      setError('Score must be 0–100 or empty.');
      return;
    }
    try {
      await students.patchMockScore(studentId, val);
      setData((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s._id === studentId ? { ...s, mockInterviewScore: val } : s
        )
      }));
      setEditingScore(null);
      setScoreValue('');
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save score.');
    }
  };

  const months = data?.months ?? [];
  const gridStudents = data?.students ?? [];

  return (
    <div className="container">
      <h1 style={{ marginBottom: '0.5rem' }}>Student Grid</h1>
      <p style={{ color: 'var(--textMuted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        View students by course and batch with month-wise present/absent and mock interview score.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 180 }}>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.9rem' }}>Course</label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
          >
            <option value="">Select course</option>
            {courseList.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.9rem' }}>Batch</label>
          <input
            type="text"
            placeholder="e.g. Batch 1"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
          />
        </div>
        <div style={{ minWidth: 100 }}>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.9rem' }}>Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={loadGrid} disabled={loading}>
          {loading ? 'Loading...' : 'Load Grid'}
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {data && (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--surface2)', zIndex: 1 }}>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  {months.map((m) => (
                    <th key={m.key} title={`${m.label} ${data.year}`} style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {m.label} (P/A)
                    </th>
                  ))}
                  <th style={{ whiteSpace: 'nowrap' }}>Mock Score</th>
                </tr>
              </thead>
              <tbody>
                {gridStudents.map((row) => (
                  <tr key={row._id}>
                    <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>
                      <strong>{row.name}</strong>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{row.email}</td>
                    <td style={{ fontSize: '0.875rem' }}>{row.phone}</td>
                    {row.attendanceByMonth.map((m) => (
                      <td key={m.month} style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                        <span style={{ color: 'var(--accent)', marginRight: '0.25rem' }}>{m.present}P</span>
                        <span style={{ color: 'var(--danger)' }}>{m.absent}A</span>
                      </td>
                    ))}
                    <td>
                      {editingScore === row._id ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0-100"
                            value={scoreValue}
                            onChange={(e) => setScoreValue(e.target.value)}
                            style={{ width: 64, padding: '0.35rem', borderRadius: 6, border: '1px solid var(--border)' }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => saveMockScore(row._id)}>Save</button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => { setEditingScore(null); setScoreValue(''); }}>Cancel</button>
                        </span>
                      ) : (
                        <span>
                          {row.mockInterviewScore != null ? (
                            <span style={{ marginRight: '0.5rem' }}>{row.mockInterviewScore}</span>
                          ) : (
                            <span style={{ color: 'var(--textMuted)', marginRight: '0.5rem' }}>–</span>
                          )}
                          <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => { setEditingScore(row._id); setScoreValue(row.mockInterviewScore ?? ''); }}>Edit</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {gridStudents.length === 0 && (
            <p style={{ padding: '1.5rem', color: 'var(--textMuted)', textAlign: 'center' }}>
              No students in this course and batch. Try another filter or add students from the Students page.
            </p>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="card" style={{ color: 'var(--textMuted)', textAlign: 'center', padding: '2rem' }}>
          Select course, enter batch, and click Load Grid to see the student grid with month-wise attendance and mock interview scores.
        </div>
      )}
    </div>
  );
}
