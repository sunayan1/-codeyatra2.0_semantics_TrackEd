import React from "react";

const StudentHeader = ({ title, user, onAvatarClick }) => {
    return (
        <header className="dash-header">
            <div>
                <h1>{title}</h1>
                <p>Logged in as: <strong>{user?.email}</strong></p>
            </div>
            <div className="avatar" onClick={onAvatarClick} style={{ cursor: 'pointer' }}>
                {user?.email?.[0]?.toUpperCase()}
            </div>
        </header>
    );
};

export default StudentHeader;
