import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    BarElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale
} from 'chart.js';
import { motion } from 'framer-motion';

// Register ChartJS components for Bar chart
ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

const categoryConfig = [
    { id: 'assignment', name: 'Assignments', max: 10 },
    { id: 'assessment', name: 'Assessments', max: 15 },
    { id: 'quiz', name: 'Quizzes', max: 20 },
    { id: 'attendance', name: 'Attendance', max: 5 }
];

const AcademicBarChart = ({ data }) => {
    const chartData = useMemo(() => {
        const obtainedData = [];
        const remainingData = [];
        const labels = [];

        categoryConfig.forEach((cat) => {
            const obtained = data[cat.id] || 0;
            const remaining = Math.max(0, cat.max - obtained);

            labels.push(cat.name);
            obtainedData.push(obtained);
            remainingData.push(remaining);
        });

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Obtained',
                    data: obtainedData,
                    backgroundColor: '#22c55e', // Vibrant Green
                    borderRadius: { topLeft: 6, bottomLeft: 6, topRight: 0, bottomRight: 0 },
                    borderSkipped: false,
                    barThickness: 32,
                },
                {
                    label: 'Remaining',
                    data: remainingData,
                    backgroundColor: '#ef4444', // Vibrant Red
                    borderRadius: { topLeft: 0, bottomLeft: 0, topRight: 6, bottomRight: 6 },
                    borderSkipped: false,
                    barThickness: 32,
                },
            ],
        };
    }, [data]);

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                right: 30
            }
        },
        scales: {
            x: {
                stacked: true,
                max: 20, // Quiz max
                grid: {
                    color: 'rgba(0,0,0,0.05)',
                    drawBorder: false,
                },
                ticks: {
                    stepSize: 5,
                    color: '#64748b',
                    font: { family: "'Outfit', sans-serif" }
                },
                title: {
                    display: true,
                    text: 'Marks (Visual Weighting)',
                    color: '#64748b',
                    font: { size: 12, weight: '500' }
                }
            },
            y: {
                stacked: true,
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#1e293b',
                    font: {
                        family: "'Outfit', sans-serif",
                        size: 13,
                        weight: '600',
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const cat = categoryConfig[context.dataIndex];
                        const value = context.raw;
                        const type = context.dataset.label;
                        const percentage = ((value / cat.max) * 100).toFixed(1);
                        return ` ${type}: ${value} / ${cat.max} (${percentage}%)`;
                    },
                    afterBody: function (items) {
                        const index = items[0].dataIndex;
                        const cat = categoryConfig[index];
                        return `\nTotal Weight: ${cat.max} marks`;
                    }
                },
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleFont: { size: 14, family: "'Outfit', sans-serif" },
                bodyFont: { size: 13, family: "'Outfit', sans-serif" },
                padding: 12,
                cornerRadius: 10,
                displayColors: true,
            }
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ width: '100%', height: '400px', padding: '10px' }}
        >
            <Bar data={chartData} options={options} />
        </motion.div>
    );
};

export default AcademicBarChart;
