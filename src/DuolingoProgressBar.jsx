import React from 'react';
import './DuolingoProgressBar.css';

const DuolingoProgressBar = ({ value, max = 100 }) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className="duo-progress-container">
            <div
                className="duo-progress-fill"
                style={{ width: `${percentage}%` }}
            >
                <div className="duo-progress-shine" />
            </div>
        </div>
    );
};

export default DuolingoProgressBar;
