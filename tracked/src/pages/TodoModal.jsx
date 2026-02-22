import { useEffect, useState } from "react";
import { tasksAPI } from "../services/api";
import "./style/TodoModal.css";

const TodoModal = ({ onClose }) => {
    const [task, setTask] = useState("");
    const [priority, setPriority] = useState(1);
    const [status, setStatus] = useState("pending");
    const [todos, setTodos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTodos = async () => {
            try {
                const response = await tasksAPI.getAll();
                setTodos(response.data || []);
            } catch (error) {
                console.error("Error loading tasks:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTodos();
    }, []);

    const addTask = async () => {
        if (!task.trim()) return;

        try {
            const response = await tasksAPI.create({
                title: task,
                status: status,
                priority_level: priority,
                target_time: new Date().toLocaleDateString('en-CA') // Default to Today (Local)
            });
            setTodos([...todos, response.data]);
            setTask("");
            setPriority(1);
            setStatus("pending");
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Failed to add task. Please try again.");
        }
    };

    const toggleComplete = async (id) => {
        try {
            const response = await tasksAPI.toggle(id);
            setTodos(
                todos.map((t) =>
                    t.task_id === id ? response.data : t
                )
            );
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    const deleteTask = async (id) => {
        try {
            await tasksAPI.delete(id);
            setTodos(todos.filter((t) => t.task_id !== id));
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Failed to delete task. Please try again.");
        }
    };

    return (
        <div className="todo-overlay">
            <div className="todo-modal">

                <header>
                    <h2>📝 Whiteboard Todos</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </header>

                <div className="todo-input-group">
                    <input
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        placeholder="Write a new task..."
                        onKeyDown={(e) => e.key === "Enter" && addTask()}
                        className="main-input"
                    />
                    <div className="todo-options">
                        <select
                            value={priority}
                            onChange={(e) => setPriority(parseInt(e.target.value))}
                            className="todo-select"
                        >
                            <option value={1}>Low Priority</option>
                            <option value={3}>Medium Priority</option>
                            <option value={5}>High Priority</option>
                        </select>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="todo-select"
                        >
                            <option value="pending">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Done</option>
                        </select>
                        <button onClick={addTask}>Add</button>
                    </div>
                </div>

                {isLoading ? (
                    <p className="loading">Loading tasks...</p>
                ) : (
                    <ul className="todo-list">
                        {todos.map((t) => (
                            <li
                                key={t.task_id}
                                className={t.status === 'completed' ? "done" : ""}
                            >
                                <div className="todo-left" onClick={() => toggleComplete(t.task_id)}>
                                    <span className="todo-checkbox">
                                        {t.status === 'completed' ? "✅" : "⬜"}
                                    </span>
                                    <span className="todo-title">{t.title}</span>
                                </div>
                                <button className="delete-iso-btn" onClick={() => deleteTask(t.task_id)}>
                                    🗑️
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {!isLoading && todos.length === 0 && (
                    <p className="empty">No tasks yet. Stay productive!</p>
                )}

            </div>
        </div>
    );
};

export default TodoModal;
