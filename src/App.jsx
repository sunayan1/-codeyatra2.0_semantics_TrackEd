import React, { useState, useEffect, useRef } from 'react';
import AcademicBarChart from './AcademicBarChart';
import SummaryPieChart from './SummaryPieChart';
import DuolingoProgressBar from './DuolingoProgressBar';
import { BookOpen, CheckCircle, HelpCircle, UserCheck, AlertCircle, TrendingUp, Search, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryConfig = [
  { id: 'assignment', name: 'Assignments', max: 10, icon: BookOpen },
  { id: 'assessment', name: 'Assessments', max: 15, icon: CheckCircle },
  { id: 'quiz', name: 'Quizzes', max: 20, icon: HelpCircle },
  { id: 'attendance', name: 'Attendance', max: 5, icon: UserCheck }
];

const studentsData = [
  {
    id: 1,
    name: "Aaryan Sharma",
    rollNo: "CS101",
    marks: { assignment: 9, assessment: 13, quiz: 18, attendance: 5 }
  },
  {
    id: 2,
    name: "Sneha Kapali",
    rollNo: "CS102",
    marks: { assignment: 7, assessment: 11, quiz: 15, attendance: 4 }
  },
  {
    id: 3,
    name: "Bibek Poudel",
    rollNo: "CS103",
    marks: { assignment: 5, assessment: 8, quiz: 10, attendance: 3 }
  },
  {
    id: 4,
    name: "Nikita Rai",
    rollNo: "CS104",
    marks: { assignment: 10, assessment: 15, quiz: 20, attendance: 5 }
  }
];

function App() {
  const [selectedStudentId, setSelectedStudentId] = useState(1);
  const [marks, setMarks] = useState(studentsData[0].marks);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      const currentStudent = studentsData.find(s => s.id === selectedStudentId);
      if (currentStudent) {
        validateAndSet(currentStudent.marks);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedStudentId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateAndSet = (newData) => {
    const newErrors = {};
    const validatedData = { ...newData };

    categoryConfig.forEach(cat => {
      const value = newData[cat.id];
      if (value < 0) {
        newErrors[cat.id] = `${cat.name} cannot be negative.`;
        validatedData[cat.id] = 0;
      } else if (value > cat.max) {
        newErrors[cat.id] = `${cat.name} cannot exceed ${cat.max}.`;
        validatedData[cat.id] = cat.max;
      }
    });

    setErrors(newErrors);
    setMarks(validatedData);
  };

  const selectedStudent = studentsData.find(s => s.id === selectedStudentId);
  const totalObtained = Object.values(marks).reduce((acc, curr) => acc + curr, 0);

  const filteredStudents = studentsData.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="dashboard-card"
      >
        <header className="header">
          <div className="header-content">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="badge-tag"
            >
              <TrendingUp size={14} />
              STUDENT PERFORMANCE PORTAL
            </motion.div>
            <h1>
              Academic Insights for <br />
              <span className="student-highlight">{selectedStudent?.name}</span>
            </h1>
            <p className="subtitle-text">
              Detailed performance metrics and behavioral analysis
            </p>
          </div>

          <section className="search-section">
            {!isSearchOpen ? (
              <motion.button
                layoutId="search-bar"
                className="search-btn"
                onClick={() => setIsSearchOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Search size={18} />
                <span>Search Student</span>
              </motion.button>
            ) : (
              <motion.div
                layoutId="search-bar"
                className="search-container"
                ref={dropdownRef}
              >
                <Search size={18} style={{ marginLeft: '0.8rem', color: '#94a3b8' }} />
                <input
                  autoFocus
                  className="search-input"
                  placeholder="ID or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  className="search-close"
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', display: 'flex' }}
                >
                  <X size={18} color="#94a3b8" />
                </button>

                {searchQuery && (
                  <div className="search-results">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => (
                        <button
                          key={student.id}
                          className="result-item"
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="result-info">
                            <span className="result-name">{student.name}</span>
                            <span className="result-roll">ID: {student.rollNo}</span>
                          </div>
                          <span className="result-score">
                            {Object.values(student.marks).reduce((a, b) => a + b, 0)}/50
                          </span>
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                        No results for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            <AnimatePresence>
              {selectedStudent && !isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="student-profile-badge"
                >
                  <div className="profile-avatar">
                    <User size={16} />
                  </div>
                  <div className="profile-details">
                    <span className="profile-name">Current Selection</span>
                    <span className="profile-roll">Empowering {selectedStudent.rollNo}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </header>

        <main>
          {loading ? (
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{ width: '50px', height: '50px', border: '5px solid #e2e8f0', borderTopColor: '#22c55e', borderRadius: '50%' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              <section className="summary-section">
                <div style={{ textAlign: 'center', maxWidth: '300px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Total Progress</h2>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    <strong>{selectedStudent?.name}'s</strong> overall performance across all categories.
                    Currently standing at <strong>{totalObtained} out of 50</strong> marks.
                  </p>
                </div>

                <SummaryPieChart obtained={totalObtained} total={50} />

                <div style={{ marginTop: '1.5rem', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>
                    <span>Progress to Completion</span>
                    <span>{Math.round((totalObtained / 50) * 100)}%</span>
                  </div>
                  <DuolingoProgressBar value={totalObtained} max={50} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="legend-item">
                    <span className="legend-color green" style={{ borderRadius: '50%', width: '16px', height: '16px' }}></span>
                    <span style={{ fontWeight: '600' }}>Obtained Marks</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color red" style={{ borderRadius: '50%', width: '16px', height: '16px', opacity: 0.3 }}></span>
                    <span style={{ fontWeight: '600', color: '#94a3b8' }}>Remaining Gap</span>
                  </div>
                </div>
              </section>

              <section style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Category Breakdown</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#22c55e', fontWeight: 'bold' }}>
                    <motion.div
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}
                    />
                    LIVE DATA
                  </div>
                </div>
                <AcademicBarChart data={marks} />
              </section>

              <div className="stats-container">
                {categoryConfig.map((cat) => {
                  const value = marks[cat.id];
                  const percent = (value / cat.max) * 100;
                  const Icon = cat.icon;

                  let percentClass = 'percent-low';
                  if (percent >= 80) percentClass = 'percent-high';
                  else if (percent >= 50) percentClass = 'percent-mid';

                  return (
                    <motion.div
                      key={cat.id}
                      className="stat-item"
                      whileHover={{ scale: 1.05, translateY: -5 }}
                      layout
                      style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.8)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span className="stat-label">{cat.name}</span>
                        <Icon size={20} style={{ color: '#94a3b8' }} />
                      </div>
                      <span className="stat-value">{value} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {cat.max}</span></span>
                      <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                        <DuolingoProgressBar value={value} max={cat.max} />
                      </div>
                      <span className={`stat-percent ${percentClass}`}>
                        {percent.toFixed(0)}%
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <AnimatePresence>
                {Object.keys(errors).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="error-message error-active"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={18} />
                      <strong>Validation Errors Detected:</strong>
                    </div>
                    <ul style={{ paddingLeft: '24px', marginTop: '10px' }}>
                      {Object.values(errors).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </main>

        <footer style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.6 }}>
          <p style={{ fontSize: '0.875rem' }}>&copy; 2026 Academic Performance Portal • Search-Ready Insights</p>
        </footer>
      </motion.div>
    </div>
  );
}

export default App;
