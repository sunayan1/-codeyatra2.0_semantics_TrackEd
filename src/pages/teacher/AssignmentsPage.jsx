import { useState, useEffect, useRef } from 'react';
import { assignmentsAPI, submissionsAPI } from '../../services/api';

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    deadline: '',
    desc: '',
  });
  const [showSubmissions, setShowSubmissions] = useState(null);

  // Reference material (optional) for the assignment
  const [refFileName, setRefFileName] = useState('');
  const [refFileData, setRefFileData] = useState(null);
  const refFileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // const loadData = async () => {
  //     const [aRes, sRes] = await Promise.all([
  //         assignmentsAPI.getAll(),
  //         submissionsAPI.getAll()
  //     ]);
  //     setAssignments(aRes.data || []);
  //     setSubmissions(sRes.data || []);
  //     setIsLoading(false);
  // };
  const loadData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        assignmentsAPI.getAll(),
        submissionsAPI.getAll(),
      ]);

      // Access the .data property from the response object
      setAssignments(Array.isArray(aRes.data) ? aRes.data : []);
      setSubmissions(Array.isArray(sRes.data) ? sRes.data : []);

      setIsLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setAssignments([]); // Fallback to prevent .map() crash
      setSubmissions([]);
      setIsLoading(false);
    }
  };

  const handleRefFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Reference file is too large. Maximum size is 10MB.');
      return;
    }
    setRefFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setRefFileData(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!form.title || !form.subject || !form.deadline)
      return alert('Fill title, subject, and deadline');

    const payload = {
      ...form,
      ref_url: refFileData || null, // optional reference material
      ref_name: refFileName || null,
    };

    const res = await assignmentsAPI.create(payload);
    setAssignments((a) => [res.data, ...a]);
    setForm({ title: '', subject: '', deadline: '', desc: '' });
    setRefFileName('');
    setRefFileData(null);
    if (refFileInputRef.current) refFileInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    await assignmentsAPI.delete(id);
    setAssignments((a) => a.filter((x) => x.id !== id));
  };

  // Open a Base64 or URL file in a new tab
  const handleViewFile = (fileUrl) => {
    if (!fileUrl) return;
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
      return;
    }
    try {
      const arr = fileUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const newTab = window.open(blobUrl, '_blank');
      if (!newTab) alert('Please allow popups to view files.');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
      alert('Could not open file.');
    }
  };

  return (
    <div className="sub-page">
      {/* ── Create Assignment Form ── */}
      <div className="form-card">
        <h3>New Assignment</h3>
        <div className="form-row">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <div className="form-row">
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="date-input"
          />
          <input
            placeholder="Description (optional)"
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
        </div>

        {/* Optional reference material upload */}
        <div style={{ marginTop: '0.75rem' }}>
          <p
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              marginBottom: '0.4rem',
            }}
          >
            📎 Reference Material{' '}
            <span style={{ fontStyle: 'italic' }}>
              (optional — PDF, image, etc.)
            </span>
          </p>
          <label className="file-label">
            {refFileName || 'Attach Reference File (optional)'}
            <input
              type="file"
              hidden
              accept=".pdf,image/*,.txt,.doc,.docx"
              ref={refFileInputRef}
              onChange={handleRefFileChange}
            />
          </label>
          {refFileName && (
            <p
              style={{
                fontSize: '0.78rem',
                color: '#10b981',
                marginTop: '0.3rem',
              }}
            >
              ✅ {refFileName} attached
            </p>
          )}
        </div>

        <button
          className="save-btn"
          onClick={handleAdd}
          style={{ marginTop: '1rem' }}
        >
          Assign
        </button>
      </div>

      {/* ── Assignment Cards ── */}
      <div className="assignment-list">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          assignments.map((a) => (
            <div className="assignment-card" key={a.id}>
              <div className="asgn-top">
                <div>
                  <p className="asgn-title">{a.title}</p>
                  <p className="note-meta">
                    {a.subject} · Due: {a.deadline}
                  </p>
                </div>
                <div className="asgn-actions">
                  <button
                    className="badge badge-blue"
                    onClick={() =>
                      setShowSubmissions(showSubmissions === a.id ? null : a.id)
                    }
                  >
                    View Submissions (
                    {submissions.filter((s) => s.assignmentId === a.id).length})
                  </button>
                  {/* Show reference file button if teacher attached one */}
                  {a.ref_url && (
                    <button
                      className="badge badge-yellow"
                      onClick={() => handleViewFile(a.ref_url)}
                      style={{ border: 'none', cursor: 'pointer' }}
                      title={`View: ${a.ref_name || 'Reference Material'}`}
                    >
                      📎 Ref Material
                    </button>
                  )}
                  <button
                    className="del-btn"
                    onClick={() => handleDelete(a.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {a.desc && <p className="asgn-desc">{a.desc}</p>}

              {/* Submissions panel */}
              {showSubmissions === a.id && (
                <div className="submissions-panel">
                  {submissions
                    .filter((s) => s.assignmentId === a.id)
                    .map((sub) => (
                      <div key={sub.id} className="submission-item">
                        <p>
                          <strong>{sub.studentEmail}</strong>
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginTop: '0.25rem',
                          }}
                        >
                          <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                            📄 {sub.fileName || 'submission.pdf'}
                          </p>
                          {/* View the student's submitted file */}
                          {sub.file_url && (
                            <button
                              className="badge badge-purple"
                              style={{
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                              }}
                              onClick={() => handleViewFile(sub.file_url)}
                            >
                              View Submission
                            </button>
                          )}
                        </div>
                        <p className="note-meta">
                          Submitted: {new Date(sub.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  {submissions.filter((s) => s.assignmentId === a.id).length ===
                    0 && <p className="empty">No submissions yet.</p>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentsPage;
