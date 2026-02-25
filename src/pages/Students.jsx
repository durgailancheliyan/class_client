import { useState, useEffect } from 'react';
import { students, courses, excel } from '../api';

const user = JSON.parse(localStorage.getItem('user') || '{}');
const isAdmin = user.role === 'admin';

export default function Students() {
  const [list, setList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', course: '', batch: '', mockInterviewScore: '' });
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = async () => {
    try {
      const params = {};
      if (filterCourse) params.course = filterCourse;
      if (filterBatch) params.batch = filterBatch;
      const [s, c] = await Promise.all([
        students.list(params).then((r) => r.data),
        courses.list().then((r) => r.data)
      ]);
      setList(s);
      setCourseList(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterCourse, filterBatch]);

  const openAdd = () => {
    setForm({ name: '', email: '', phone: '', course: courseList[0]?._id || '', batch: '', mockInterviewScore: '' });
    setModal('add');
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone,
      course: row.course?._id || row.course,
      batch: row.batch,
      mockInterviewScore: row.mockInterviewScore ?? '',
      _id: row._id
    });
    setModal('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await students.create({ name: form.name, email: form.email, phone: form.phone, course: form.course, batch: form.batch });
      } else {
        const payload = { name: form.name, email: form.email, phone: form.phone, course: form.course, batch: form.batch };
        if (form.mockInterviewScore !== '' && form.mockInterviewScore != null) {
          const num = Number(form.mockInterviewScore);
          payload.mockInterviewScore = Number.isNaN(num) ? null : num;
        } else payload.mockInterviewScore = null;
        await students.update(form._id, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      await students.delete(id);
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected student(s)?`)) return;
    try {
      const { data } = await students.bulkDelete(ids);
      setSelectedIds(new Set());
      setImportResult({ added: 0, skipped: 0, message: data.message });
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Bulk delete failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === list.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(list.map((r) => r._id)));
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      const { data } = await excel.importStudents(importFile);
      setImportResult(data);
      setImportFile(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Import failed');
    }
  };

  const downloadTemplate = async () => {
    try {
      const { data } = await excel.downloadStudentTemplate();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student-upload-template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.response?.data?.message || 'Download failed');
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Students</h1>
      <p style={{ color: 'var(--textMuted)', marginBottom: '0.5rem' }}>
        {isAdmin
          ? 'Upload student details via Excel (or add manually). Use unique phone per student. Trainers can view this list and create attendance links from Attendance Sessions.'
          : 'View student list. To take attendance, go to Attendance Sessions, create a session and share the link with students.'}
      </p>
      <p style={{ color: 'var(--textMuted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Excel columns: Name, Email, Phone, Course, Batch. Course must match an existing course name.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
        >
          <option value="">All courses</option>
          {courseList.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by batch"
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', width: 160 }}
        />
        {isAdmin && (
          <>
            <button type="button" className="btn btn-primary" onClick={openAdd}>Add student</button>
            <button type="button" className="btn btn-secondary" onClick={downloadTemplate}>Download Excel template</button>
            {selectedIds.size > 0 && (
              <button type="button" className="btn btn-danger" onClick={handleBulkDelete}>
                Delete selected ({selectedIds.size})
              </button>
            )}
            <form onSubmit={handleImport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0])}
              />
              <button type="submit" className="btn btn-secondary" disabled={!importFile}>Import Excel</button>
            </form>
          </>
        )}
      </div>

      {importResult && (
        <div className="card" style={{ marginBottom: '1rem', background: 'var(--surface2)' }}>
          {importResult.message != null ? importResult.message : `Imported: ${importResult.added} | Skipped: ${importResult.skipped}`}
        </div>
      )}

      <div className="table-wrap card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--textMuted)' }}>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                {isAdmin && (
                  <th style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      checked={list.length > 0 && selectedIds.size === list.length}
                      onChange={toggleSelectAll}
                      title="Select all"
                    />
                  </th>
                )}
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Mock score</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row._id}>
                  {isAdmin && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row._id)}
                        onChange={() => toggleSelect(row._id)}
                      />
                    </td>
                  )}
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.phone}</td>
                  <td>{row.course?.name}</td>
                  <td>{row.batch}</td>
                  <td>{row.mockInterviewScore != null ? row.mockInterviewScore : '–'}</td>
                  {isAdmin && (
                    <td>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', marginRight: '0.5rem' }} onClick={() => openEdit(row)}>Edit</button>
                      <button type="button" className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDelete(row._id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && list.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--textMuted)' }}>No students. Add or import from Excel.</p>
        )}
      </div>

      {modal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }} onClick={() => setModal(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>{modal === 'add' ? 'Add student' : 'Edit student'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone (unique)</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Course</label>
                <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required>
                  {courseList.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Batch</label>
                <input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Mock interview score (0–100, optional)</label>
                <input type="number" min={0} max={100} placeholder="Leave empty" value={form.mockInterviewScore} onChange={(e) => setForm({ ...form, mockInterviewScore: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
