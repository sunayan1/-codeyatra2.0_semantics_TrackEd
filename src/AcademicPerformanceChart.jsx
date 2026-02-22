import React, { useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler
);

const MAX_MARKS = {
    assignments: 25,
    exams: 50,
    quizzes: 15,
    participation: 10
};

const AcademicPerformanceDashboard = () => {
    const [marks, setMarks] = useState({
        assignments: 20,
        exams: 38,
        quizzes: 12,
        participation: 9
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const numValue = Math.min(Math.max(0, Number(value)), MAX_MARKS[name]);
        setMarks(prev => ({ ...prev, [name]: numValue }));
    };

    const totals = useMemo(() => {
        const obtained = Object.values(marks).reduce((a, b) => a + b, 0);
        const totalPossible = Object.values(MAX_MARKS).reduce((a, b) => a + b, 0);
        const percentage = (obtained / totalPossible) * 100;

        let status = { label: 'Poor', class: 'status-poor' };
        if (percentage >= 85) status = { label: 'Outstanding', class: 'status-outstanding' };
        else if (percentage >= 70) status = { label: 'Very Good', class: 'status-good' };
        else if (percentage >= 50) status = { label: 'Fair', class: 'status-fair' };

        return { obtained, totalPossible, percentage, status };
    }, [marks]);

    const doughnutData = {
        labels: ['Completed', 'Remaining'],
        datasets: [{
            data: [totals.obtained, totals.totalPossible - totals.obtained],
            backgroundColor: ['#6366f1', '#e2e8f0'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const radarData = {
        labels: ['Assignments', 'Exams', 'Quizzes', 'Participation'],
        datasets: [{
            label: 'Performance %',
            data: [
                (marks.assignments / MAX_MARKS.assignments) * 100,
                (marks.exams / MAX_MARKS.exams) * 100,
                (marks.quizzes / MAX_MARKS.quizzes) * 100,
                (marks.participation / MAX_MARKS.participation) * 100
            ],
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: '#6366f1',
            pointBackgroundColor: '#6366f1',
            fill: true
        }]
    };

    return (
        <div className="dashboard-container">
            <div className="glass-card">
                <div className="header-section">
                    <h1>TrackEd Analytics</h1>
                    <p>Real-time academic performance monitoring and projection</p>
                </div>

                <div className="main-grid">
                    <div className="metrics-column">
                        <div className="metric-card">
                            <span className="metric-label">Overall Percentage</span>
                            <span className="metric-value">{totals.percentage.toFixed(1)}%</span>
                            <span className={`status-badge ${totals.status.class}`}>{totals.status.label}</span>
                        </div>

                        <div className="metric-card">
                            <span className="metric-label">Score Summary</span>
                            <span className="metric-value">{totals.obtained} / {totals.totalPossible}</span>
                        </div>

                        <div className="metric-card">
                            <span className="metric-label">Adjust Metrics</span>
                            <div className="input-grid">
                                {Object.keys(MAX_MARKS).map(key => (
                                    <div key={key} className="input-group">
                                        <label>{key.charAt(0).toUpperCase() + key.slice(1)} (Max {MAX_MARKS[key]})</label>
                                        <input
                                            type="number"
                                            name={key}
                                            value={marks[key]}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="chart-column">
                        <div className="chart-container">
                            <h3 style={{ marginBottom: '1.5rem', color: '#64748b' }}>Performance Distribution</h3>
                            <div style={{ width: '100%', height: '300px' }}>
                                <Radar data={radarData} options={{ maintainAspectRatio: false }} />
                            </div>
                            <div style={{ width: '200px', height: '200px', marginTop: '2rem' }}>
                                <Doughnut
                                    data={doughnutData}
                                    options={{
                                        cutout: '70%',
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicPerformanceDashboard;
