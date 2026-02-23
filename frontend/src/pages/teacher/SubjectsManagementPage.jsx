import { useState, useEffect } from "react";
import { subjectsAPI } from "../../services/api";

const SubjectsManagementPage = () => {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [enrollEmail, setEnrollEmail] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        setIsLoading(true);
        try {
            const res = await subjectsAPI.getMine();
            setSubjects(res.data?.data || res.data || []);
        } catch (error) {
            console.error("Error loading subjects:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSubject = async () => {
        if (!title || !description) return alert("Title and description are required");
        try {
            const res = await subjectsAPI.create({ title, description });
            const newSub = res.data?.data || res.data;
            setSubjects([newSub, ...subjects]);
            setTitle("");
            setDescription("");
        } catch (error) {
            console.error("Create subject failed:", error);
            alert("Failed to create subject");
        }
    };

    const handleSelectSubject = async (id) => {
        setSelectedSubjectId(id);
        setLoadingStudents(true);
        try {
            const res = await subjectsAPI.getStudents(id);
            setEnrolledStudents(res.data?.data || res.data || []);
        } catch (error) {
            console.error("Error loading students:", error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleEnroll = async () => {
        if (!enrollEmail) return alert("Enter student email");
        try {
            const res = await subjectsAPI.enroll({
                student_email: enrollEmail,
                subject_id: selectedSubjectId
            });

            const enrollmentData = res.data?.data || res.data;
            if (enrollmentData?.student) {
                // Ensure we include enrollment_id for the unenroll functionality to work
                const newStudentEntry = {
                    ...enrollmentData.student,
                    enrollment_id: enrollmentData.enrollment_id
                };
                setEnrolledStudents([...enrolledStudents, newStudentEntry]);
                setEnrollEmail("");
                alert("Student enrolled successfully!");
            } else {
                throw new Error("Invalid response format from server");
            }
        } catch (error) {
            console.error("Enrollment failed:", error);
            const errMsg = error.response?.data?.error || error.message || "Failed to enroll student";
            alert(errMsg);
        }
    };

    const handleUnenroll = async (enrollmentId) => {
        try {
            await subjectsAPI.unenroll(enrollmentId);
            setEnrolledStudents(enrolledStudents.filter(s => s.enrollment_id !== enrollmentId));
        } catch (error) {
            console.error("Unenrollment failed:", error);
        }
    };

    return (
        <div className="sub-page">
            <div className="form-card">
                <h3>Create New Subject</h3>
                <div className="form-row">
                    <input
                        placeholder="Subject Title (e.g. Mathematics III)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <input
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <button className="save-btn" onClick={handleCreateSubject}>Create Subject</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                <div className="subjects-list">
                    <h4>Your Subjects</h4>
                    {isLoading ? <p>Loading...</p> : subjects.length === 0 ? <p>No subjects yet.</p> : subjects.map(s => (
                        <div
                            key={s.id}
                            className={`note-card ${selectedSubjectId === s.id ? 'active' : ''}`}
                            onClick={() => handleSelectSubject(s.id)}
                            style={{ cursor: 'pointer', borderLeft: selectedSubjectId === s.id ? '4px solid #2563eb' : 'none' }}
                        >
                            <p className="note-title">{s.title}</p>
                            <p className="note-meta">{s.description}</p>
                        </div>
                    ))}
                </div>

                <div className="enrollment-management">
                    <h4>{selectedSubjectId ? `Manage Students: ${subjects.find(s => s.id === selectedSubjectId)?.title}` : 'Select a subject to manage students'}</h4>
                    {selectedSubjectId && (
                        <>
                            <div className="form-row" style={{ marginTop: '1rem' }}>
                                <input
                                    placeholder="Student Email to Enroll"
                                    value={enrollEmail}
                                    onChange={(e) => setEnrollEmail(e.target.value)}
                                />
                                <button className="save-btn" onClick={handleEnroll}>Enroll</button>
                            </div>
                            <div className="enrolled-students" style={{ marginTop: '1.5rem' }}>
                                {loadingStudents ? <p>Loading students...</p> : enrolledStudents.length === 0 ? <p>No students enrolled yet.</p> : enrolledStudents.map(student => (
                                    <div key={student.id} className="attendance-row" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 500 }}>{student.full_name}</p>
                                            <p className="note-meta" style={{ margin: 0 }}>{student.email}</p>
                                        </div>
                                        <button className="del-btn" onClick={() => handleUnenroll(student.enrollment_id)}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubjectsManagementPage;
