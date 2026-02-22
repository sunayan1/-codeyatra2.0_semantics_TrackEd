import React, { useState, useEffect } from 'react';
import AcademicBarChart from './AcademicBarChart';
import SummaryPieChart from './SummaryPieChart';
import { BookOpen, CheckCircle, HelpCircle, UserCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryConfig = [
  { id: 'assignment', name: 'Assignments', max: 10, icon: BookOpen },
  { id: 'assessment', name: 'Assessments', max: 15, icon: CheckCircle },
  { id: 'quiz', name: 'Quizzes', max: 20, icon: HelpCircle },
  { id: 'attendance', name: 'Attendance', max: 5, icon: UserCheck }
];

function App() {
  const [marks, setMarks] = useState({
    assignment: 0,
    assessment: 0,
    quiz: 0,
    attendance: 0
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = {
        assignment: 8,
        assessment: 10,
        quiz: 15,
        attendance: 4
      };

      validateAndSet(response);
      setLoading(false);
    };

    fetchData();
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

  const totalObtained = Object.values(marks).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="dashboard-card">
      <header className="header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: '99px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: '700' }}
        >
          <TrendingUp size={16} />
          PERFORMANCE DASHBOARD v2.0
        </motion.div>
        <h1>Academic Performance</h1>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Comprehensive Performance Distribution & Summary</p>
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

            {/* Top Section: Summary Pie Chart and Overall Info */}
            <section className="summary-section">
              <div style={{ textAlign: 'center', maxWidth: '300px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Total Progress</h2>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Your overall performance calculated across all academic categories.
                  Currently standing at <strong>{totalObtained} out of 50</strong> marks.
                </p>
              </div>

              <SummaryPieChart obtained={totalObtained} total={50} />

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

            {/* Middle Section: Grouped Bar Chart */}
            <section style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Category Breakdown</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#22c55e', fontWeight: 'bold' }}>
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}
                  />
                  LIVE SYNC
                </div>
              </div>
              <AcademicBarChart data={marks} />
            </section>

            {/* Bottom Stats Grid */}
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
                    style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.8)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span className="stat-label">{cat.name}</span>
                      <Icon size={20} style={{ color: '#94a3b8' }} />
                    </div>
                    <span className="stat-value">{value} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {cat.max}</span></span>
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
        <p style={{ fontSize: '0.875rem' }}>&copy; 2026 Academic Performance Portal • High Fidelity Data Visualization</p>
      </footer>
    </div>
  );
}

export default App;
