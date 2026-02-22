export const LEARNING_DATA = {
    "data-structures": {
        id: "data-structures",
        title: "Data Structures",
        chapters: [
            {
                id: "intro",
                title: "Introduction to DS",
                levels: [
                    {
                        id: "level-1",
                        title: "What is a Data Structure?",
                        slides: [
                            { title: "Definition", content: "A data structure is a specialized format for organizing, processing, retrieving and storing data." },
                            { title: "Types", content: "Common types include arrays, lists, stacks, queues, and trees." },
                            { title: "Importance", content: "Choosing the right data structure can improve the efficiency of an algorithm." }
                        ],
                        quiz: [
                            { question: "What is an array?", options: ["A collection of items", "A type of loop", "A function"], answer: 0 },
                            { question: "Is a Stack LIFO or FIFO?", options: ["LIFO", "FIFO"], answer: 0 }
                        ]
                    },
                    {
                        id: "level-2",
                        title: "Time Complexity",
                        slides: [
                            { title: "Big O", content: "Big O notation describes the upper bound of the time complexity." },
                            { title: "O(1)", content: "Constant time complexity. The operation takes the same amount of time regardless of input size." }
                        ],
                        quiz: [
                            { question: "What does O(1) represent?", options: ["Constant time", "Linear time", "Quadratic time"], answer: 0 }
                        ]
                    }
                ]
            }
        ]
    },
    "operating-systems": {
        id: "operating-systems",
        title: "Operating Systems",
        chapters: [
            {
                id: "basics",
                title: "OS Basics",
                levels: [
                    {
                        id: "level-1",
                        title: "What is an OS?",
                        slides: [
                            { title: "OS Definition", content: "An operating system is software that manages computer hardware and software resources." }
                        ],
                        quiz: [
                            { question: "Is Windows an OS?", options: ["Yes", "No"], answer: 0 }
                        ]
                    }
                ]
            }
        ]
    }
};

export const SUBJECTS = [
    { id: "data-structures", title: "Data Structures", color: "#7c3aed" },
    { id: "operating-systems", title: "Operating Systems", color: "#2563eb" },
    { id: "mathematics-iii", title: "Mathematics III", color: "#059669" },
    { id: "digital-logic", title: "Digital Logic", color: "#d97706" },
    { id: "computer-networks", title: "Computer Networks", color: "#db2777" }
];
