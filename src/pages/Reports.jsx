import { useState, useEffect } from 'react';
import { reports, courses, excel } from '../api';

const user = JSON.parse(localStorage.getItem('user') || '{}');

export default function Reports() {
  const [daily, setDaily] = useState({ sessions: [], attendances: [] });
  const [analytics, setAnalytics] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [courseFilter, setCourseFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadDaily = async () => {
    try {
      const { data } = await reports.daily(date);
      setDaily(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnalytics = async () => {
    try {
      const params = {};
      if (courseFilter) params.courseId = courseFilter;
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await reports.analytics(params);
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const c = await courses.list().then((r) => r.data);
        setCourseList(c);
        await loadDaily();
        await loadAnalytics();
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    loadDaily();
  }, [date]);

  useEffect(() => {
    loadAnalytics();
  }, [courseFilter, from, to]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (courseFilter) params.courseId = courseFilter;
      const { data } = await excel.exportAttendance(params);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance-export.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--textMuted)' }}>Loading reports...</p>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Reports</h1>
      <p style={{ color: 'var(--textMuted)', marginBottom: '1.5rem' }}>
        Daily attendance and course-wise analytics. Export to Excel.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Export date range</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Course filter</label>
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">All courses</option>
            {courseList.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Download Excel'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Daily attendance – {date}</h2>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 180 }} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course / Batch</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {daily.attendances?.length === 0 ? (
                <tr><td colSpan={4} style={{ color: 'var(--textMuted)' }}>No attendance for this day</td></tr>
              ) : (
                daily.attendances?.map((a) => (
                  <tr key={a._id}>
                    <td>{a.student?.name}</td>
                    <td>{a.session?.course?.name} / {a.session?.batch}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    <td>{new Date(a.markedAt).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Course-wise analytics</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Batch</th>
                <th>Course</th>
                <th>Present</th>
                <th>Total</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {analytics.length === 0 ? (
                <tr><td colSpan={7} style={{ color: 'var(--textMuted)' }}>No data</td></tr>
              ) : (
                analytics.map((row) => (
                  <tr key={row._id}>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.batch}</td>
                    <td>{row.course}</td>
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
    </div>
  );
}
