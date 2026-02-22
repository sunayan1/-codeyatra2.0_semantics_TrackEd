import React from 'react';

const ProfileModal = ({ user, onClose, onLogout }) => {
    if (!user) return null;

    // Use full_name from backend, fallback to email-derived name
    const name = user.full_name || user.email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    const initial = (user.full_name ? user.full_name[0] : user.email[0]).toUpperCase();

    return (
        <div className="profile-overlay" onClick={onClose}>
            <div className="profile-card" onClick={(e) => e.stopPropagation()}>
                <button className="profile-close" onClick={onClose}>✕</button>

                <div className="profile-header">
                    <div className="profile-avatar large-avatar">
                        {initial}
                    </div>
                    <div className="profile-main-info">
                        <h2>{name}</h2>
                        <span className={`role-badge role-${user.role}`}>
                            {user.role === 'student' ? 'Student' : 'Teacher'}
                        </span>
                    </div>
                </div>

                <div className="profile-details">
                    <div className="detail-item">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{user.email}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Account ID</span>
                        <span className="detail-value">SC-2026-{Math.floor(1000 + Math.random() * 9000)}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Member Since</span>
                        <span className="detail-value">Jan 2026</span>
                    </div>
                </div>

                <div className="profile-actions">
                    <button className="profile-btn secondary-btn" onClick={onClose}>Close</button>
                    <button className="profile-btn logout-profile-btn" onClick={onLogout}>Logout</button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
