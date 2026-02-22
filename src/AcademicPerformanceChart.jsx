import React, { useState, useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import './AcademicChart.css';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
);

const MAX = {
    assignment: 10,
    assessment: 15,
    quiz: 20,
    attendance: 5
};

const AcademicPerformanceChart = () => {
    const [marks, setMarks] = useState({
        assignment: 8,
        assessment: 10,
        quiz: 15,
        attendance: 4
    });

    const validatedData = useMemo(() => {
        const result = {};
        for (const key in MAX) {
            let val = Number(marks[key]) || 0;
            if (val < 0) val = 0;
            if (val > MAX[key]) val = MAX[key];
            result[key] = val;
        }
        return result;
    }, [marks]);

    const total = useMemo(() =>
        Object.values(validatedData).reduce((a, b) => a + b, 0),
        [validatedData]
    );

    const percent = useMemo(() => (total / 50) * 100, [total]);

    const getPerformanceLabel = (p) => {
        if (p >= 85) return "Outstanding";
        if (p >= 70) return "Very Good";
        if (p >= 55) return "Satisfactory";
        if (p >= 40) return "Needs Improvement";
        return "Critical";
    };


    const ringChartData = {
        datasets: [{
            data: [total, 50 - total],
            backgroundColor: ["#1db609ff", "#f81d1dff"],
            borderWidth: 0
        }]
    };

    const ringChartOptions = {
        cutout: "75%",
        animation: { duration: 1000 },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        maintainAspectRatio: false
    };

    const barChartData = {
        labels: ["Assignments", "Assessments", "Quizzes", "Attendance"],
        datasets: [
            {
                label: "Completed",
                data: [
                    validatedData.assignment,
                    validatedData.assessment,
                    validatedData.quiz,
                    validatedData.attendance
                ],
                backgroundColor: "#1db609ff",
                borderRadius: 8
            },
            {
                label: "Remaining",
                data: [
                    MAX.assignment - validatedData.assignment,
                    MAX.assessment - validatedData.assessment,
                    MAX.quiz - validatedData.quiz,
                    MAX.attendance - validatedData.attendance
                ],
                backgroundColor: "#ef4444",
                borderRadius: 8
            }
        ]
    };

    const barChartOptions = {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900 },
        scales: {
            x: {
                stacked: true,
                max: 20,
                grid: { display: false }
            },
            y: {
                stacked: true,
                grid: { display: false }
            }
        },
        plugins: {
            legend: { position: "bottom" }
        }
    };

    return (
        <div className="academic-dashboard">
            <div className="container">
                <header className="academic-header">
                    <h1>Academic Performance</h1>
                    <div className="subtitle">Weighted Evaluation • Total 50 Marks</div>
                </header>

                <div className="stats" id="dashboard-stats">
                    <div className="stat-box">
                        <span className="stat-label">Total Marks</span>
                        <span className="stat-value" id="totalScore">{total} / 50</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">Percentage</span>
                        <span className="stat-value" id="totalPercent">{percent.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="chart-area">
                    <div className="ring-wrapper" id="ring-container">
                        <Doughnut
                            data={ringChartData}
                            options={ringChartOptions}
                            id="totalRing"
                        />
                        <div className="center-info">
                            <div id="centerScore">{total} / 50</div>
                            <div id="performanceLabel">{getPerformanceLabel(percent)}</div>
                        </div>
                    </div>

                    <div className="bar-chart-container" id="bar-chart-container">
                        <Bar
                            data={barChartData}
                            options={barChartOptions}
                            id="barChart"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AcademicPerformanceChart;
