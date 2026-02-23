import { useState, useEffect, useRef } from 'react';
import { assignmentsAPI, submissionsAPI, attendanceAPI } from '../../services/api';

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    subject_id: '',
    due_date: '',
    description: '',
  });
  const [showSubmissions, setShowSubmissions] = useState(null);

  // Reference material (optional) for the assignment
  const [refFileName, setRefFileName] = useState('');
  const [refFileData, setRefFileData] = useState(null);
  const refFileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [aRes, sRes, subRes] = await Promise.all([
        assignmentsAPI.getAll(),
        submissionsAPI.getAll(),
        attendanceAPI.getSubjects(),
      ]);

      // Access the .data property from the response object
      setAssignments(aRes.data?.data || aRes.data || []);
      setSubmissions(sRes.data?.data || sRes.data || []);
      setSubjects(subRes.data?.data || subRes.data || []);

      setIsLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setAssignments([]); // Fallback to prevent .map() crash
      setSubmissions([]);
      setSubjects([]);
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
    if (!form.title || !form.subject_id || !form.due_date)
      return alert('Fill title, select subject, and deadline');

    const payload = {
      ...form,
      content_url: refFileData || null, // optional reference material
    };

    try {
      const res = await assignmentsAPI.create(payload);
      const resData = res.data?.data || res.data;
      // Supabase insert returns an array, so we need the first element
      const serverResult = Array.isArray(resData) ? resData[0] : resData;

      // Enrichment for immediate display
      const selectedSub = subjects.find(s => s.id === form.subject_id);
      const createdAssignment = {
        ...serverResult,
        subject: selectedSub ? selectedSub.title : ''
      };

      setAssignments((a) => [createdAssignment, ...a]);
      setForm({ title: '', subject_id: '', due_date: '', description: '' });
      setRefFileName('');
      setRefFileData(null);
      if (refFileInputRef.current) refFileInputRef.current.value = '';
    } catch (error) {
      console.error("Assignment creation failed:", error);
      alert("Failed to create assignment.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await assignmentsAPI.delete(id);
      setAssignments((a) => a.filter((x) => x.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
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
          <select
            value={form.subject_id}
            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
            className="subject-select"
          >
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="date-input"
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                    <strong>{a.subject}</strong> · Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No date'}
                  </p>
                </div>
                <div className="asgn-actions">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${submissions.filter((s) => s.assignment_id === a.id).length > 0 ? 'badge-green' : 'badge-blue'}`}>
                      {submissions.filter((s) => s.assignment_id === a.id).length} Handed In
                    </span>
                    <button
                      className="badge badge-purple"
                      style={{ border: 'none', cursor: 'pointer' }}
                      onClick={() =>
                        setShowSubmissions(showSubmissions === a.id ? null : a.id)
                      }
                    >
                      {showSubmissions === a.id ? 'Hide Submissions' : 'View Submissions'}
                    </button>
                  </div>

                  {/* Show reference file button if teacher attached one */}
                  {a.content_url && (
                    <button
                      className="badge badge-yellow"
                      onClick={() => handleViewFile(a.content_url)}
                      style={{ border: 'none', cursor: 'pointer' }}
                      title={`View Reference Material`}
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
              {a.description && <p className="asgn-desc">{a.description}</p>}

              {/* Submissions panel */}
              {showSubmissions === a.id && (
                <div className="submissions-panel">
                  {submissions
                    .filter((s) => s.assignment_id === a.id)
                    .map((sub) => (
                      <div key={sub.id} className="submission-item" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p><strong>{sub.studentName || 'Student'}</strong> ({sub.studentEmail})</p>
                            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>📄 {sub.fileName || 'submission.pdf'}</p>
                            <p className="note-meta">Submitted: {new Date(sub.submitted_at || sub.created_at).toLocaleString()}</p>
                          </div>
                          <span className={`badge ${sub.status === 'graded' ? 'badge-green' : 'badge-orange'}`}>
                            {sub.status === 'graded' ? 'Graded' : 'Pending'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
                          {sub.file_url && (
                            <button
                              className="badge badge-purple"
                              style={{ border: 'none', cursor: 'pointer' }}
                              onClick={() => handleViewFile(sub.file_url)}
                            >
                              View File
                            </button>
                          )}

                          {/* Grading UI */}
                          <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                            <input
                              type="number"
                              placeholder="Marks/15"
                              defaultValue={sub.marks}
                              min="0" max="15"
                              id={`marks-${sub.id}`}
                              className="date-input"
                              style={{ width: '80px', padding: '0.25rem' }}
                            />
                            <input
                              placeholder="Feedback"
                              defaultValue={sub.feedback}
                              id={`feedback-${sub.id}`}
                              className="date-input"
                              style={{ flex: 1, padding: '0.25rem' }}
                            />
                            <button
                              className="save-btn"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={async () => {
                                const marks = parseFloat(document.getElementById(`marks-${sub.id}`).value);
                                const feedback = document.getElementById(`feedback-${sub.id}`).value;
                                try {
                                  await submissionsAPI.grade(sub.id, { marks, feedback });
                                  alert("Grade saved!");
                                  loadData(); // Refresh to show new grade/status
                                } catch (e) {
                                  alert("Failed to save grade");
                                }
                              }}
                            >
                              Save Grade
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {submissions.filter((s) => s.assignment_id === a.id).length === 0 && (
                    <p className="empty">No submissions yet.</p>
                  )}
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
