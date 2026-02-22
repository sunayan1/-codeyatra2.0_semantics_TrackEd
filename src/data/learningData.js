export const LEARNING_DATA = {
    "data-structures": {
        id: "data-structures",
        title: "Data Structures",
        chapters: [
            {
                id: "ds-core",
                title: "Core Data Structures",
                levels: [
                    {
                        id: "level-1",
                        title: "Introduction to DS",
                        slides: [
                            { title: "Definition", content: "A data structure is a way of organizing data in a computer so that it can be used effectively." },
                            { title: "Efficiency", content: "Good data structures help reduce time and space complexity." }
                        ],
                        quiz: [
                            { question: "What is a data structure?", options: ["A way to organize data", "A type of hardware", "A programming language"], answer: 0 }
                        ]
                    },
                    {
                        id: "level-2",
                        title: "Arrays & Lists",
                        slides: [
                            { title: "Arrays", content: "Fixed-size sequential collection of elements of same type." },
                            { title: "Linked Lists", content: "Elements are stored in nodes, each pointing to the next." }
                        ],
                        quiz: [
                            { question: "Are arrays fixed in size?", options: ["Yes", "No"], answer: 0 }
                        ]
                    },
                    {
                        id: "level-3",
                        title: "Stacks & Queues",
                        slides: [
                            { title: "Stacks", content: "LIFO (Last In First Out) structure." },
                            { title: "Queues", content: "FIFO (First In First Out) structure." }
                        ],
                        quiz: [
                            { question: "What does LIFO stand for?", options: ["Last In First Out", "Lead In Fast Out"], answer: 0 }
                        ]
                    },
                    {
                        id: "level-4",
                        title: "Trees Basics",
                        slides: [
                            { title: "Binary Tree", content: "A tree where each node has at most two children." }
                        ],
                        quiz: [
                            { question: "How many children can a binary tree node have?", options: ["Max 1", "Max 2", "Infinite"], answer: 1 }
                        ]
                    },
                    {
                        id: "level-5",
                        title: "Graph Theory",
                        slides: [
                            { title: "Graphs", content: "A set of vertices connected by edges." }
                        ],
                        quiz: [
                            { question: "What connects vertices in a graph?", options: ["Edges", "Loops", "Stacks"], answer: 0 }
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
                id: "os-core",
                title: "OS Fundamentals",
                levels: [
                    {
                        id: "level-1",
                        title: "What is an OS?",
                        slides: [
                            { title: "Definition", content: "Resource manager and extended machine." }
                        ],
                        quiz: [
                            { question: "Is Linux an OS?", options: ["Yes", "No"], answer: 0 }
                        ]
                    },
                    {
                        id: "level-2",
                        title: "Processes",
                        slides: [
                            { title: "Process", content: "A program in execution." }
                        ],
                        quiz: [
                            { question: "What is a process?", options: ["Program in execution", "A hardware chip"], answer: 0 }
                        ]
                    },
                    {
                        id: "level-3",
                        title: "CPU Scheduling",
                        slides: [
                            { title: "Algorithms", content: "FCFS, SJF, Round Robin." }
                        ],
                        quiz: [
                            { question: "Which is a scheduling algorithm?", options: ["FCFS", "HTTP"], answer: 0 }
                        ]
                    },
                    {
                        id: "level-4",
                        title: "Memory Management",
                        slides: [
                            { title: "Paging", content: "Dividing memory into fixed-size blocks." }
                        ],
                        quiz: [
                            { question: "What is paging?", options: ["Memory management", "A search engine"], answer: 0 }
                        ]
                    },
                    {
                        id: "level-5",
                        title: "File Systems",
                        slides: [
                            { title: "Structure", content: "How files are stored and organized on disk." }
                        ],
                        quiz: [
                            { question: "What manages files on disk?", options: ["File System", "RAM"], answer: 0 }
                        ]
                    }
                ]
            }
        ]
    },
    "mathematics-iii": {
        id: "mathematics-iii",
        title: "Mathematics III",
        chapters: [
            {
                id: "math-core",
                title: "Advanced Mathematics",
                levels: [
                    {
                        id: "level-1",
                        title: "Partial Differentiation",
                        slides: [{ title: "Partial Derivs", content: "Derivative with respect to one variable." }],
                        quiz: [{ question: "Is f_x a partial derivative?", options: ["Yes", "No"], answer: 0 }]
                    },
                    {
                        id: "level-2",
                        title: "Double Integrals",
                        slides: [{ title: "Area Integration", content: "Calculating volume under a surface." }],
                        quiz: [{ question: "Is double integral used for volume?", options: ["Yes", "No"], answer: 0 }]
                    },
                    {
                        id: "level-3",
                        title: "Laplace Transform",
                        slides: [{ title: "Transform", content: "Converting time domain to frequency domain." }],
                        quiz: [{ question: "Does Laplace help solve ODEs?", options: ["Yes", "No"], answer: 0 }]
                    },
                    {
                        id: "level-4",
                        title: "Fourier Series",
                        slides: [{ title: "Series", content: "Representing periodic functions as sums of sines/cosines." }],
                        quiz: [{ question: "Is Fourier Series for periodic functions?", options: ["Yes", "No"], answer: 0 }]
                    },
                    {
                        id: "level-5",
                        title: "Vector Calculus",
                        slides: [{ title: "Grad/Div/Curl", content: "Differential operators on vector fields." }],
                        quiz: [{ question: "Is Gradient a vector?", options: ["Yes", "No"], answer: 0 }]
                    }
                ]
            }
        ]
    },
    "digital-logic": {
        id: "digital-logic",
        title: "Digital Logic",
        chapters: [
            {
                id: "dl-core",
                title: "Digital Logic Systems",
                levels: [
                    {
                        id: "level-1",
                        title: "Binary Systems",
                        slides: [{ title: "Bits", content: "0 and 1 representation." }],
                        quiz: [{ question: "What is base 2 called?", options: ["Decimal", "Binary"], answer: 1 }]
                    },
                    {
                        id: "level-2",
                        title: "Logic Gates",
                        slides: [{ title: "Gates", content: "AND, OR, NOT, NAND, NOR." }],
                        quiz: [{ question: "Output of OR gate for (1,0)?", options: ["0", "1"], answer: 1 }]
                    },
                    {
                        id: "level-3",
                        title: "Boolean Algebra",
                        slides: [{ title: "Laws", content: "De Morgan's laws and simplification." }],
                        quiz: [{ question: "Is A + 0 = A?", options: ["Yes", "No"], answer: 0 }]
                    },
                    {
                        id: "level-4",
                        title: "Combinational Logic",
                        slides: [{ title: "Adders", content: "Half Adder and Full Adder." }],
                        quiz: [{ question: "Can Half Adder add 3 bits?", options: ["Yes", "No"], answer: 1 }]
                    },
                    {
                        id: "level-5",
                        title: "Sequential Logic",
                        slides: [{ title: "Flip Flops", content: "Memory elements using feedback." }],
                        quiz: [{ question: "Are Flip Flops memory elements?", options: ["Yes", "No"], answer: 0 }]
                    }
                ]
            }
        ]
    },
    "computer-networks": {
        id: "computer-networks",
        title: "Computer Networks",
        chapters: [
            {
                id: "cn-core",
                title: "Networking Concepts",
                levels: [
                    {
                        id: "level-1",
                        title: "Basics of Networking",
                        slides: [{ title: "LAN/WAN", content: "Local and Wide Area Networks." }],
                        quiz: [{ question: "Is Internet a WAN?", options: ["Yes", "No"], answer: 0 }]
                    },
                    {
                        id: "level-2",
                        title: "OSI Model",
                        slides: [{ title: "7 Layers", content: "Physical to Application layer." }],
                        quiz: [{ question: "Top layer of OSI?", options: ["Physical", "Application"], answer: 1 }]
                    },
                    {
                        id: "level-3",
                        title: "TCP/IP Protocol",
                        slides: [{ title: "IP Stats", content: "Routing and addressing." }],
                        quiz: [{ question: "What does IP stand for?", options: ["Internet Protocol", "Internal Post"], answer: 0 }]
                    },
                    {
                        id: "level-4",
                        title: "Network Security",
                        slides: [{ title: "Firewalls", content: "Protecting the network from unauthorized access." }],
                        quiz: [{ question: "Does a firewall block traffic?", options: ["Yes", "No"], answer: 0 }]
                    },
                    {
                        id: "level-5",
                        title: "HTTP & DNS",
                        slides: [{ title: "Web Protocols", content: "How the web works." }],
                        quiz: [{ question: "Does DNS resolve names?", options: ["Yes", "No"], answer: 0 }]
                    }
                ]
            }
        ]
    }
};

export const SUBJECTS = [
    { id: "data-structures", title: "Data Structures", color: "#2563eb" },
    { id: "operating-systems", title: "Operating Systems", color: "#2563eb" },
    { id: "mathematics-iii", title: "Mathematics III", color: "#059669" },
    { id: "digital-logic", title: "Digital Logic", color: "#d97706" },
    { id: "computer-networks", title: "Computer Networks", color: "#db2777" }
];
