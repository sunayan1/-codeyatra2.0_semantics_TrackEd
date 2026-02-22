import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend);

const SummaryPieChart = ({ obtained, total }) => {
    const remaining = Math.max(0, total - obtained);
    const percent = ((obtained / total) * 100).toFixed(1);

    const data = useMemo(() => ({
        labels: ['Total Obtained', 'Total Remaining'],
        datasets: [
            {
                data: [obtained, remaining],
                backgroundColor: [
                    '#22c55e', // Success Green
                    'rgba(239, 68, 68, 0.1)', // Light Red for "gap"
                ],
                borderColor: [
                    '#22c55e',
                    '#ef4444',
                ],
                borderWidth: 2,
                hoverOffset: 4,
                cutout: '75%', // Makes it a sleek ring
            },
        ],
    }), [obtained, remaining]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` ${context.label}: ${context.raw} / ${total}`
                }
            }
        },
    };

    return (
        <div style={{ position: 'relative', width: '220px', height: '220px' }}>
            <Doughnut data={data} options={options} />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
            }}>
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: '#1e293b' }}
                >
                    {percent}%
                </motion.span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Overall
                </span>
            </div>
        </div>
    );
};

export default SummaryPieChart;
