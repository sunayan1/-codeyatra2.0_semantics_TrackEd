export const STUDENT_PROGRESS = {
    "anjana@gmail.com": {
        attendance: 92,
        assignments: [
            { title: "React Basics", status: "submitted", grade: "A", review: "Well structured code." },
            { title: "CSS Flexbox", status: "pending", grade: null, review: null },
            { title: "JS Fundamentals", status: "submitted", grade: "B+", review: "Good logic, but could optimize loops." }
        ],
        fileReviews: [
            { fileName: "project_plan.pdf", status: "reviewed", feedback: "Approved for development." },
            { fileName: "schema_design.png", status: "under review", feedback: null }
        ]
    },
    "roshan@gmail.com": {
        attendance: 85,
        assignments: [
            { title: "React Basics", status: "submitted", grade: "B", review: "Decent work." }
        ],
        fileReviews: []
    }
};

export const ALL_STUDENTS = [
    { email: "anjana@gmail.com", name: "Anjana Shrestha" },
    { email: "roshan@gmail.com", name: "Roshan Tamang" },
    { email: "priya@gmail.com", name: "Priya Karki" },
    { email: "bikal@gmail.com", name: "Bikal Thapa" },
    { email: "sita@gmail.com", name: "Sita Rai" },
    { email: "manish@gmail.com", name: "Manish Gurung" }
];
