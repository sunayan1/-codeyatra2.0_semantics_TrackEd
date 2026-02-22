import { useEffect, useState } from "react";
import { calendarAPI, tasksAPI } from "../services/api";
import "./style/CalendarModal.css";

const CalendarModal = ({ onClose }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [events, setEvents] = useState({});
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit task state
    const [editingTask, setEditingTask] = useState(null);
    const [editForm, setEditForm] = useState({});

    // New task form state
    const [newTaskName, setNewTaskName] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState(1);
    const [newTaskStatus, setNewTaskStatus] = useState("pending");
    const [newTaskDuration, setNewTaskDuration] = useState("");

    // New event state
    const [newEventText, setNewEventText] = useState("");

    // Delete Confirmation State
    const [taskToDelete, setTaskToDelete] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [eventsRes, tasksRes] = await Promise.all([
                    calendarAPI.getAll(),
                    tasksAPI.getAll()
                ]);

                const eventsData = eventsRes.data || [];
                const tasksData = tasksRes.data || [];

                const eventsByDate = {};
                eventsData.forEach(event => {
                    // Fix timezone: Always parse to Local Date string (YYYY-MM-DD)
                    // This handles both "2026-02-23" (string) and "2026-02-22T18:15:00.000Z" (Date/ISO)
                    const raw = event.event_date;
                    let dateKey;

                    try {
                        const d = new Date(raw);
                        // en-CA gives YYYY-MM-DD format
                        dateKey = d.toLocaleDateString("en-CA");
                    } catch (e) {
                        console.error("Invalid event date:", raw);
                        return;
                    }

                    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
                    eventsByDate[dateKey].push({
                        id: event.event_id,
                        title: event.event_text,
                        type: 'event'
                    });
                });

                setEvents(eventsByDate);
                setTasks(tasksData);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Helper: get YYYY-MM-DD string in LOCAL timezone (no UTC shift)
    const toLocalDateStr = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startDay = new Date(viewYear, viewMonth, 1).getDay();

    const getPriorityColor = (p) => {
        if (p >= 5) return '#ef4444';
        if (p >= 3) return '#f59e0b';
        return '#10b981';
    };
    const getPriorityLabel = (p) => {
        if (p >= 5) return 'High';
        if (p >= 3) return 'Medium';
        return 'Low';
    };

    // Task date range using estimated_minutes
    const getTaskDateRange = (task) => {
        if (!task.target_time) return null;

        // Handle date string using LOCAL TIME
        // If task.target_time is "2026-02-22T18:15:00Z" (Nepal 23rd), we want 23rd.
        const d = new Date(task.target_time);
        const startLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const durationDays = task.estimated_minutes
            ? Math.max(0, Math.ceil(task.estimated_minutes / (24 * 60)) - 1)
            : 0;
        const end = new Date(startLocal);
        end.setDate(end.getDate() + durationDays);
        return { start: startLocal, end, durationDays };
    };

    const taskFallsOnDate = (task, date) => {
        const range = getTaskDateRange(task);
        if (!range) return false;
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return d >= range.start && d <= range.end;
    };

    const getTasksForDate = (date) => tasks.filter(t => taskFallsOnDate(t, date));

    const getEventsForDate = (date) => {
        const dateStr = toLocalDateStr(date);
        return events[dateStr] || [];
    };

    const formatDateRange = (task) => {
        const range = getTaskDateRange(task);
        if (!range || range.durationDays === 0) return null;
        const opts = { month: 'short', day: 'numeric' };
        return `${range.start.toLocaleDateString(undefined, opts)} – ${range.end.toLocaleDateString(undefined, opts)}`;
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    const isToday = (day) =>
        day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

    // Click a day cell to select it and open the side panel
    const selectDate = (date) => {
        setSelectedDate(date);
        setEditingTask(null);
        setNewTaskName("");
        setNewTaskPriority(1);
        setNewTaskStatus("pending");
        setNewTaskDuration("");
        setNewEventText("");
    };

    // Add task for the selected date
    const addTask = async () => {
        if (!newTaskName.trim() || !selectedDate) return;
        try {
            const response = await tasksAPI.create({
                title: newTaskName,
                status: newTaskStatus,
                priority_level: newTaskPriority,
                target_time: toLocalDateStr(selectedDate),
                estimated_minutes: newTaskDuration ? parseInt(newTaskDuration) : null
            });
            setTasks([...tasks, response.data]);
            setNewTaskName("");
            setNewTaskPriority(1);
            setNewTaskStatus("pending");
            setNewTaskDuration("");
        } catch (error) {
            console.error("Error adding task:", error);
            console.error("Detailed error:", error.response || error.message);
            alert(`Failed to add task: ${error.message || "Unknown error"}`);
        }
    };

    // Add calendar event for the selected date
    const addEvent = async () => {
        if (!newEventText.trim() || !selectedDate) return;
        try {
            const dateStr = toLocalDateStr(selectedDate);
            const response = await calendarAPI.create({
                event_text: newEventText,
                event_date: dateStr
            });
            const newEv = { id: response.data.event_id, title: response.data.event_text, type: 'event' };
            setEvents(prev => ({
                ...prev,
                [dateStr]: [...(prev[dateStr] || []), newEv],
            }));
            setNewEventText("");
        } catch (error) {
            console.error("Error adding event:", error);
        }
    };

    const deleteEvent = async (eventId) => {
        if (!selectedDate) return;
        const dateStr = toLocalDateStr(selectedDate);
        try {
            await calendarAPI.delete(eventId);
            setEvents(prev => ({
                ...prev,
                [dateStr]: (prev[dateStr] || []).filter(e => e.id !== eventId),
            }));
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    // Request delete (opens modal)
    const accessDeleteTask = (taskId) => {
        const task = tasks.find(t => t.task_id === taskId);
        if (task) setTaskToDelete(task);
    };

    // Confirm delete (executes API)
    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;
        try {
            await tasksAPI.delete(taskToDelete.task_id);
            setTasks(prev => prev.filter(t => t.task_id !== taskToDelete.task_id));
            if (editingTask && editingTask.task_id === taskToDelete.task_id) {
                setEditingTask(null);
            }
            setTaskToDelete(null);
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Failed to delete task.");
        }
    };

    const toggleTaskCompletion = async (taskId) => {
        try {
            const response = await tasksAPI.toggle(taskId);
            setTasks(tasks.map(t => t.task_id === taskId ? response.data : t));
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    const openTaskEditor = (task) => {
        setEditingTask(task);

        // Helper to convert UTC date string to Local ISO string (YYYY-MM-DDThh:mm)
        // This is needed because input type="datetime-local" expects local time, 
        // but new Date(t).toISOString() gives UTC.
        const toLocalISO = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const offsetMs = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - offsetMs);
            return localDate.toISOString().slice(0, 16);
        };

        setEditForm({
            target_time: toLocalISO(task.target_time),
            priority_level: task.priority_level || 1,
            reminder_time: toLocalISO(task.reminder_time),
            completion_percentage: task.completion_percentage || 0,
            estimated_minutes: task.estimated_minutes || 0,
            status: task.status || 'pending'
        });
    };

    const saveTaskEdit = async () => {
        if (!editingTask) return;
        try {
            const response = await tasksAPI.update(editingTask.task_id, {
                target_time: editForm.target_time ? new Date(editForm.target_time).toISOString() : null,
                priority_level: editForm.priority_level,
                reminder_time: editForm.reminder_time ? new Date(editForm.reminder_time).toISOString() : null,
                completion_percentage: editForm.completion_percentage,
                estimated_minutes: editForm.estimated_minutes,
                status: editForm.status
            });
            setTasks(tasks.map(t => t.task_id === editingTask.task_id ? response.data : t));
            setEditingTask(null);
        } catch (error) {
            console.error("Error updating task:", error);
            alert("Failed to update task.");
        }
    };

    const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long" });

    // Data for selected date side panel
    const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    return (
        <div className="calendar-overlay">
            <div className={`calendar-modal-full ${selectedDate ? 'with-panel' : ''}`}>

                {/* ===== CALENDAR GRID AREA ===== */}
                <div className="calendar-grid-area">
                    <header className="calendar-header">
                        <h2>📅 Study Calendar</h2>
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </header>

                    <div className="month-nav">
                        <button className="nav-btn" onClick={prevMonth}>◀</button>
                        <h3 className="month-title">{monthName} {viewYear}</h3>
                        <button className="nav-btn" onClick={nextMonth}>▶</button>
                    </div>

                    {isLoading ? (
                        <div className="loading-state">Loading calendar...</div>
                    ) : (
                        <div className="full-calendar-grid">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                <div key={d} className="grid-day-name">{d}</div>
                            ))}

                            {Array(startDay).fill(null).map((_, i) => (
                                <div key={`empty-${i}`} className="grid-cell empty-cell" />
                            ))}

                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const dayNum = i + 1;
                                const date = new Date(viewYear, viewMonth, dayNum);
                                const dayTasks = getTasksForDate(date);
                                const dayEvents = getEventsForDate(date);
                                const isSelected = selectedDate &&
                                    selectedDate.getDate() === dayNum &&
                                    selectedDate.getMonth() === viewMonth &&
                                    selectedDate.getFullYear() === viewYear;

                                return (
                                    <div
                                        key={i}
                                        className={`grid-cell ${isToday(dayNum) ? 'today-cell' : ''} ${isSelected ? 'selected-cell' : ''}`}
                                        onClick={() => selectDate(date)}
                                    >
                                        <div className={`cell-date ${isToday(dayNum) ? 'today-date' : ''}`}>
                                            {dayNum}
                                        </div>
                                        <div className="cell-items">
                                            {dayTasks.slice(0, 3).map(task => (
                                                <div
                                                    key={task.task_id}
                                                    className={`cell-task ${task.status === 'completed' ? 'task-done' : ''}`}
                                                    style={{ borderLeftColor: getPriorityColor(task.priority_level) }}
                                                >
                                                    <span className="cell-task-title">{task.title}</span>
                                                    <div className="cell-task-meta">
                                                        <span className="cell-badge" style={{ backgroundColor: getPriorityColor(task.priority_level) }}>
                                                            {getPriorityLabel(task.priority_level)}
                                                        </span>
                                                        {task.status === 'completed' && <span className="cell-badge done-badge">Done</span>}
                                                        {task.status === 'in_progress' && <span className="cell-badge progress-badge">In Progress</span>}
                                                    </div>
                                                </div>
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <div className="cell-more">+{dayTasks.length - 3} more</div>
                                            )}
                                            {dayEvents.slice(0, 2).map(ev => (
                                                <div key={ev.id} className="cell-event">
                                                    <span className="cell-event-title">💭 {ev.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ===== SIDE PANEL ===== */}
                {selectedDate && (
                    <div className="side-panel">
                        <div className="panel-header">
                            <h3>{selectedDate.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                            <button className="close-btn" onClick={() => setSelectedDate(null)}>✕</button>
                        </div>

                        {/* Add Task Form */}
                        <div className="panel-section">
                            <h4>📌 Add Task</h4>
                            <div className="add-task-form">
                                <input
                                    type="text"
                                    value={newTaskName}
                                    onChange={(e) => setNewTaskName(e.target.value)}
                                    placeholder="Task name..."
                                    className="form-input"
                                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                                />
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>🔥 Priority</label>
                                        <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(parseInt(e.target.value))}>
                                            <option value={1}>Low</option>
                                            <option value={3}>Medium</option>
                                            <option value={5}>High</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>📋 Status</label>
                                        <select value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value)}>
                                            <option value="pending">Not Started</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Done</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-field" style={{ flex: 1 }}>
                                        <label>⏱️ Duration (minutes)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={newTaskDuration}
                                            onChange={(e) => setNewTaskDuration(e.target.value)}
                                            placeholder="Optional"
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <button className="add-task-btn" onClick={addTask}>+ Add Task</button>
                            </div>
                        </div>

                        {/* Tasks List */}
                        <div className="panel-section">
                            <h4>📋 Tasks ({selectedDateTasks.length})</h4>
                            {selectedDateTasks.length === 0 ? (
                                <p className="empty-text">No tasks for this date</p>
                            ) : (
                                <div className="panel-task-list">
                                    {selectedDateTasks.map(task => {
                                        const rangeLabel = formatDateRange(task);
                                        return (
                                            <div
                                                key={task.task_id}
                                                className={`panel-task-card ${task.status === 'completed' ? 'panel-task-done' : ''}`}
                                                style={{ borderLeftColor: getPriorityColor(task.priority_level) }}
                                            >
                                                <div className="panel-task-top">
                                                    <button
                                                        className="checkbox-btn"
                                                        onClick={() => toggleTaskCompletion(task.task_id)}
                                                    >
                                                        {task.status === 'completed' ? '✅' : '⬜'}
                                                    </button>
                                                    <span className={`panel-task-title ${task.status === 'completed' ? 'struck' : ''}`}>
                                                        {task.title}
                                                    </span>
                                                    <button className="edit-task-btn" onClick={() => openTaskEditor(task)} title="Edit">
                                                        ✏️
                                                    </button>
                                                    <button className="delete-task-btn" onClick={() => accessDeleteTask(task.task_id)} title="Delete" style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                        🗑️
                                                    </button>
                                                </div>
                                                <div className="panel-task-props">
                                                    <div className="prop-row">
                                                        <span className="prop-label">🔥 Priority</span>
                                                        <span className="prop-badge" style={{ backgroundColor: getPriorityColor(task.priority_level) }}>
                                                            {getPriorityLabel(task.priority_level)}
                                                        </span>
                                                    </div>
                                                    <div className="prop-row">
                                                        <span className="prop-label">📋 Status</span>
                                                        <span className={`prop-badge status-${task.status}`}>
                                                            {task.status === 'completed' ? 'Done' : task.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                                        </span>
                                                    </div>
                                                    {rangeLabel && (
                                                        <div className="prop-row">
                                                            <span className="prop-label">📆 Range</span>
                                                            <span className="prop-value">{rangeLabel}</span>
                                                        </div>
                                                    )}
                                                    {task.completion_percentage > 0 && (
                                                        <div className="prop-row">
                                                            <span className="prop-label">📊 Progress</span>
                                                            <div className="progress-inline">
                                                                <div className="progress-bar-track">
                                                                    <div className="progress-bar-fill" style={{
                                                                        width: `${task.completion_percentage}%`,
                                                                        backgroundColor: task.completion_percentage === 100 ? '#10b981' : '#8b5cf6'
                                                                    }} />
                                                                </div>
                                                                <span>{task.completion_percentage}%</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {task.reminder_time && (
                                                        <div className="prop-row">
                                                            <span className="prop-label">🔔 Reminder</span>
                                                            <span className="prop-value">
                                                                {new Date(task.reminder_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Events */}
                        <div className="panel-section">
                            <h4>💭 Events ({selectedDateEvents.length})</h4>
                            <div className="add-event-row">
                                <input
                                    type="text"
                                    value={newEventText}
                                    onChange={(e) => setNewEventText(e.target.value)}
                                    placeholder="Add event..."
                                    className="form-input"
                                    onKeyDown={(e) => e.key === "Enter" && addEvent()}
                                />
                                <button className="add-event-sm-btn" onClick={addEvent}>+</button>
                            </div>
                            {selectedDateEvents.map(ev => (
                                <div key={ev.id} className="panel-event-card">
                                    <span>💭 {ev.title}</span>
                                    <button className="delete-event-btn" onClick={() => deleteEvent(ev.id)}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== TASK EDIT POPUP ===== */}
                {editingTask && (
                    <div className="task-edit-overlay" onClick={() => setEditingTask(null)}>
                        <div className="task-edit-popup" onClick={(e) => e.stopPropagation()}>
                            <div className="popup-header">
                                <h3>✏️ Edit Task</h3>
                                <button className="close-btn" onClick={() => setEditingTask(null)}>✕</button>
                            </div>
                            <div className="popup-task-name">{editingTask.title}</div>
                            <div className="popup-fields">
                                <div className="popup-field">
                                    <label>🎯 Deadline</label>
                                    <input type="datetime-local" value={editForm.target_time || ''} onChange={(e) => setEditForm({ ...editForm, target_time: e.target.value })} />
                                </div>
                                <div className="popup-field">
                                    <label>⏱️ Duration (minutes)</label>
                                    <input type="number" min="0" value={editForm.estimated_minutes || 0} onChange={(e) => setEditForm({ ...editForm, estimated_minutes: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="popup-field">
                                    <label>🔥 Priority</label>
                                    <select value={editForm.priority_level} onChange={(e) => setEditForm({ ...editForm, priority_level: parseInt(e.target.value) })}>
                                        <option value={1}>Low</option>
                                        <option value={3}>Medium</option>
                                        <option value={5}>High</option>
                                    </select>
                                </div>
                                <div className="popup-field">
                                    <label>📋 Status</label>
                                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                        <option value="pending">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Done</option>
                                    </select>
                                </div>
                                <div className="popup-field">
                                    <label>🔔 Reminder</label>
                                    <input type="datetime-local" value={editForm.reminder_time || ''} onChange={(e) => setEditForm({ ...editForm, reminder_time: e.target.value })} />
                                </div>
                                <div className="popup-field">
                                    <label>📊 Completion: {editForm.completion_percentage}%</label>
                                    <input type="range" min="0" max="100" step="5" value={editForm.completion_percentage} onChange={(e) => setEditForm({ ...editForm, completion_percentage: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="popup-actions">
                                <button className="save-btn" onClick={saveTaskEdit}>💾 Save Changes</button>
                                <button className="cancel-btn" onClick={() => setEditingTask(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== DELETE CONFIRMATION POPUP ===== */}
                {taskToDelete && (
                    <div className="task-edit-overlay">
                        <div className="task-edit-popup" style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div className="popup-header">
                                <h3>⚠️ Delete Task?</h3>
                                <button className="close-btn" onClick={() => setTaskToDelete(null)}>✕</button>
                            </div>
                            <p style={{ margin: '20px 0' }}>Are you sure you want to delete: <strong>{taskToDelete.title}</strong>?</p>
                            <div className="popup-actions" style={{ justifyContent: 'center', gap: '15px' }}>
                                <button className="save-btn" style={{ backgroundColor: '#ef4444' }} onClick={confirmDeleteTask}>Yes, Delete</button>
                                <button className="cancel-btn" onClick={() => setTaskToDelete(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarModal;
