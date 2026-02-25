import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sessions, attendance } from '../api';

const LOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };

export default function AttendPage() {
  const { slug } = useParams();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [resolvedStudent, setResolvedStudent] = useState(null);
  const [resolvingPhone, setResolvingPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Location is not supported by your browser. Attendance is only allowed at Besant Technologies, Velachery, Chennai.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError('');
        setLocationLoading(false);
      },
      (err) => {
        const msg =
          err.code === 1
            ? 'Location access was denied. Please allow location to mark attendance at Besant Technologies, Velachery, Chennai.'
            : 'Could not get your location. Please enable location and try again.';
        setLocationError(msg);
        setLocationLoading(false);
      },
      LOCATION_OPTIONS
    );
  }, []);

  useEffect(() => {
    if (!location) return;
    let t;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: res } = await sessions.getBySlug(slug, { lat: location.lat, lng: location.lng });
        setSessionInfo(res.session);
        const end = new Date(res.session.closesAt).getTime();
        const tick = () => {
          const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
          setCountdown(left);
          if (left > 0) t = setTimeout(tick, 1000);
        };
        tick();
      } catch (err) {
        setError(err.response?.data?.message || 'Session not found or expired.');
        setSessionInfo(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => clearTimeout(t);
  }, [slug, location]);

  const handleContinue = async () => {
    const phoneTrimmed = phone.trim();
    if (!phoneTrimmed) {
      setError('Enter your registered phone number.');
      return;
    }
    setResolvingPhone(true);
    setError('');
    setSuccess(null);
    try {
      const { data } = await sessions.getBySlug(slug, {
        lat: location.lat,
        lng: location.lng,
        phone: phoneTrimmed
      });
      if (data.student) {
        setResolvedStudent(data.student);
      } else {
        setError('No student found with this number. Use your own registered phone only.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not find you in this batch. Use your own registered number only.');
      setResolvedStudent(null);
    } finally {
      setResolvingPhone(false);
    }
  };

  const mark = async (status) => {
    if (!resolvedStudent || !location) return;
    const phoneTrimmed = phone.trim();
    setSubmitting(true);
    setSuccess(null);
    setError('');
    try {
      await attendance.mark(slug, resolvedStudent._id, status, {
        lat: location.lat,
        lng: location.lng,
        phone: phoneTrimmed
      });
      setResolvedStudent((prev) => (prev ? { ...prev, status } : null));
      setSuccess('Attendance marked successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark.');
    } finally {
      setSubmitting(false);
    }
  };

  if (locationLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 380 }}>
          <p style={{ marginBottom: '0.5rem' }}>Checking location...</p>
          <p style={{ color: 'var(--textMuted)', fontSize: '0.9rem' }}>Attendance is only allowed at <strong>Besant Technologies, Velachery, Chennai</strong>. Please allow location access.</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 420 }}>
          <h1 style={{ marginBottom: '0.5rem', color: 'var(--danger)' }}>Location required</h1>
          <p style={{ color: 'var(--textMuted)' }}>{locationError}</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>This link can only be used at <strong>Besant Technologies, Velachery, Chennai</strong>. Enable location in your browser and refresh when you are on campus.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <p style={{ color: 'var(--textMuted)' }}>Loading...</p>
      </div>
    );
  }

  if (error && !sessionInfo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 420 }}>
          <h1 style={{ marginBottom: '0.5rem', color: 'var(--danger)' }}>Access not allowed</h1>
          <p style={{ color: 'var(--textMuted)' }}>{error}</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Attendance is only allowed at <strong>Besant Technologies, Velachery, Chennai</strong>. No proxy/VPN. If you are on campus, allow location and try again. Links are active for 2 minutes during class hours (9 AM – 6 PM).</p>
        </div>
      </div>
    );
  }

  const open = countdown !== null && countdown > 0;

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem', background: 'var(--bg)' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '1.35rem' }}>Mark attendance</h1>
          <p style={{ color: 'var(--textMuted)', fontSize: '0.9rem' }}>
            {sessionInfo?.course?.name} – {sessionInfo?.batch}
          </p>
          {countdown !== null && (
            <p style={{ marginTop: '0.5rem', fontWeight: 600, color: open ? 'var(--accent)' : 'var(--danger)' }}>
              {open ? `Time left: ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` : 'Time's up. Link closed.'}
            </p>
          )}
        </div>

        {success && (
          <div className="card" style={{ marginBottom: '1rem', background: 'rgba(34, 197, 94, 0.15)', borderColor: 'var(--accent)' }}>
            {success}
          </div>
        )}
        {error && sessionInfo && (
          <div className="card" style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {!resolvedStudent ? (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <p style={{ marginBottom: '0.75rem', color: 'var(--textMuted)', fontSize: '0.9rem' }}>
              Enter <strong>your own</strong> registered phone number. Proxy/VPN and other numbers are not allowed.
            </p>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Your registered phone number
            </label>
            <input
              type="tel"
              placeholder="10-digit number registered with us"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(''); }}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', marginBottom: '0.75rem' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={resolvingPhone || !open || !phone.trim()}
              onClick={handleContinue}
            >
              {resolvingPhone ? 'Checking...' : 'Continue'}
            </button>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <p style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Hi, <strong>{resolvedStudent.name}</strong></p>
            {resolvedStudent.status ? (
              <p className={`badge badge-${resolvedStudent.status}`} style={{ marginTop: '0.5rem' }}>Already marked: {resolvedStudent.status}</p>
            ) : open ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={() => mark('present')}
                >
                  {submitting ? '...' : 'Present'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submitting}
                  onClick={() => mark('absent')}
                >
                  {submitting ? '...' : 'Absent'}
                </button>
              </div>
            ) : (
              <span style={{ color: 'var(--textMuted)' }}>Window closed</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
