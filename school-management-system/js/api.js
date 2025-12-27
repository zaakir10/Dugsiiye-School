const API = {
    // delay
    delay: (ms = 500) => new Promise(resolve => setTimeout(resolve, ms)),

    // Initialize mock data if empty
    init: () => {
        if (!localStorage.getItem('sms_users')) {
            const users = [
                { id: 1, name: 'Admin User', email: 'admin@dusiiye.com', password: '123', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin+User' },
                { id: 2, name: 'Mc Teacher', email: 'teacher@dugsiiye.com', password: '123', role: 'teacher', avatar: 'https://ui-avatars.com/api/?name=Mc+Teacher' },
                { id: 3, name: 'Zack Student', email: 'student@dugsiiye.com', password: '123', role: 'student', avatar: 'https://ui-avatars.com/api/?name=Zack+Student' }
            ];
            localStorage.setItem('sms_users', JSON.stringify(users));
        }

        if (!localStorage.getItem('sms_students')) {
            const students = [
                { id: 101, name: 'Zaakir hassan', email: 'Zaakir@dugsiiye.com', class: '10A', roll: '001', parentName: 'Mr. Johnson', status: 'Active', avatar: '' },
                { id: 102, name: 'Idil hassan', email: 'idil@dugsiiye.com', class: '10A', roll: '002', parentName: 'Mrs. Smith', status: 'Active', avatar: '' },
                { id: 103, name: 'Yacquub hassan', email: 'yacquub@dugsiiye.com', class: '9A', roll: '001', parentName: 'Mr. Brown', status: 'Inactive', avatar: '' }
            ];
            localStorage.setItem('sms_students', JSON.stringify(students));
        }

        if (!localStorage.getItem('sms_teachers')) {
            const teachers = [
                { id: 201, name: 'Zaakir ', email: 'zack@dugsiiya.com', subject: 'Mathematics', phone: '123-456-7890', joinDate: '2023-01-15', avatar: '' },
                { id: 202, name: 'MC hamuuda', email: 'mchamuuda@dugsiiya.com', subject: 'Science', phone: '987-654-3210', joinDate: '2023-03-10', avatar: '' }
            ];
            localStorage.setItem('sms_teachers', JSON.stringify(teachers));
        }

        if (!localStorage.getItem('sms_classes')) {
            const classes = [
                { id: 301, name: '10A', teacherId: 201, room: '101', capacity: 30 },
                { id: 302, name: '9A', teacherId: 202, room: '102', capacity: 25 }
            ];
            localStorage.setItem('sms_classes', JSON.stringify(classes));
        }

        if (!localStorage.getItem('sms_subjects')) {
            const subjects = [
                { id: 401, name: 'Mathematics', code: 'MATH101', type: 'Theory' },
                { id: 402, name: 'Science', code: 'SCI101', type: 'Theory' },
                { id: 403, name: 'English', code: 'ENG101', type: 'Theory' },
                { id: 404, name: 'Computer Science', code: 'CS101', type: 'Practical' },
                { id: 405, name: 'Physical Education', code: 'PE101', type: 'Practical' }
            ];
            localStorage.setItem('sms_subjects', JSON.stringify(subjects));
        }

        if (!localStorage.getItem('sms_notices')) {
            const notices = [
                { id: 501, title: 'Annual Sports Day', category: 'Event', content: 'Our annual sports day will be held on January 15th. All students are invited to participate.', date: new Date().toISOString() },
                { id: 502, title: 'Mid-term Exams Schedule', category: 'Urgent', content: 'Mid-term exams will start from January 5th. Please check the exams section for details.', date: new Date().toISOString() },
                { id: 503, title: 'Winter Break', category: 'General', content: 'The school will remain closed for winter break from December 25th to January 2nd.', date: new Date().toISOString() }
            ];
            localStorage.setItem('sms_notices', JSON.stringify(notices));
        }

        if (!localStorage.getItem('sms_exams')) {
            const exams = [
                { id: 601, name: 'Mid-Term Exam', className: '10A', subject: 'Mathematics', date: '2023-10-15', status: 'Completed' },
                { id: 602, name: 'Final Exam', className: '10A', subject: 'Science', date: '2023-12-20', status: 'Upcoming' }
            ];
            localStorage.setItem('sms_exams', JSON.stringify(exams));
        }

        if (!localStorage.getItem('sms_results')) {
            const results = [
                { id: 701, examId: 601, studentId: 101, marks: 85, grade: 'A', remarks: 'Good job', date: new Date().toISOString() },
                { id: 702, examId: 601, studentId: 102, marks: 92, grade: 'A+', remarks: 'Excellent', date: new Date().toISOString() }
            ];
            localStorage.setItem('sms_results', JSON.stringify(results));
        }
    },

    // Auth
    login: async (email, password) => {
        await API.delay();

        let users = JSON.parse(localStorage.getItem('sms_users') || '[]');

        // Fallback: If users array is empty (cleared storage case), re-init
        if (users.length === 0) {
            API.init();
            users = JSON.parse(localStorage.getItem('sms_users'));
        }

        let user = users.find(u => u.email === email && u.password === password);

        //  DEMO FALLBACK: Only if user not found in DB
        if (!user && email.trim() === 'admin@school.com' && password === '123') {
            user = { id: 1, name: 'Admin User', email: 'admin@school.com', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin+User' };
         
            if (users.find(u => u.email === 'admin@school.com')) {
                user = null; // Admin exists, so password must match DB
            }
        }

        // HARDCODED DEMO FALLBACK: If user types '123' but DB has 'password' (old data), allow it.
        if (!user && password === '123') {
            user = users.find(u => u.email === email);
        }

        if (user) {
            // Create sessions
            const session = {
                token: 'mock-jwt-token-' + Date.now(),
                user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
                expiry: Date.now() + 3600000 // 1 hour
            };
            localStorage.setItem('sms_session', JSON.stringify(session));
            return { success: true, data: session };
        } else {
            throw new Error('Invalid credentials');
        }
    },

    logout: async () => {
        await API.delay(200);
        localStorage.removeItem('sms_session');
        return { success: true };
    },

    // Generic CRUD
    get: async (endpoint) => {
        await API.delay();
        const data = JSON.parse(localStorage.getItem(`sms_${endpoint}`) || '[]');
        return { success: true, data };
    },

    logActivity: (message, type = 'info') => {
        const logs = JSON.parse(localStorage.getItem('sms_logs') || '[]');
        logs.unshift({
            id: Date.now(),
            message,
            type,
            time: new Date().toISOString()
        });
        localStorage.setItem('sms_logs', JSON.stringify(logs.slice(0, 20))); // Keep last 20
    },

    post: async (endpoint, item) => {
        await API.delay();
        const data = JSON.parse(localStorage.getItem(`sms_${endpoint}`) || '[]');
        const newItem = { id: Date.now(), ...item, createdAt: new Date().toISOString() };
        data.push(newItem);
        localStorage.setItem(`sms_${endpoint}`, JSON.stringify(data));

        // Auto log activity
        let logMsg = `New ${endpoint.slice(0, -1)} added`;
        if (item.name) logMsg = `Added new ${endpoint.slice(0, -1)}: ${item.name}`;
        API.logActivity(logMsg, 'success');

        return { success: true, data: newItem };
    },

    put: async (endpoint, id, item) => {
        await API.delay();
        const data = JSON.parse(localStorage.getItem(`sms_${endpoint}`) || '[]');
        const index = data.findIndex(d => d.id == id);
        if (index !== -1) {
            data[index] = { ...data[index], ...item, updatedAt: new Date().toISOString() };
            localStorage.setItem(`sms_${endpoint}`, JSON.stringify(data));

            API.logActivity(`Updated ${endpoint.slice(0, -1)}: ${item.name || id}`, 'info');

            return { success: true, data: data[index] };
        }
        throw new Error('Item not found');
    },

    delete: async (endpoint, id) => {
        await API.delay();
        const data = JSON.parse(localStorage.getItem(`sms_${endpoint}`) || '[]');
        const index = data.findIndex(d => d.id == id);
        if (index !== -1) {
            const removed = data.splice(index, 1);
            localStorage.setItem(`sms_${endpoint}`, JSON.stringify(data));

            API.logActivity(`Deleted ${endpoint.slice(0, -1)}: ${removed[0].name || id}`, 'error');

            return { success: true };
        }
        throw new Error('Item not found');
    },

    // Dashboard Stats
    getStats: async () => {
        await API.delay();
        const students = JSON.parse(localStorage.getItem('sms_students') || '[]');
        const teachers = JSON.parse(localStorage.getItem('sms_teachers') || '[]');
        const classes = JSON.parse(localStorage.getItem('sms_classes') || '[]');
        const exams = JSON.parse(localStorage.getItem('sms_exams') || '[]');
        const notices = JSON.parse(localStorage.getItem('sms_notices') || '[]');

        // Calculate attendance from history
        const attendanceHistory = JSON.parse(localStorage.getItem('sms_attendance_history') || '[]');
        let attendancePercent = 95; // Default if no data
        if (attendanceHistory.length > 0) {
            const latest = attendanceHistory[attendanceHistory.length - 1];
            attendancePercent = Math.round((latest.present / latest.total) * 100);
        }

        const fees = JSON.parse(localStorage.getItem('sms_fees') || '[]');
        const totalCollected = fees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
        const revenueGoal = 250000;
        const feeProgress = Math.round((totalCollected / revenueGoal) * 100);

        // Filter and Sort Exams (Upcoming only)
        const today = new Date().toISOString().split('T')[0];
        const upcomingExams = exams
            .filter(e => e.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        // Sort Notices (Latest first)
        const latestNotices = notices
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        // Recent Logs
        const logs = JSON.parse(localStorage.getItem('sms_logs') || '[]');

        return {
            success: true,
            data: {
                students: students.length,
                teachers: teachers.length,
                classes: classes.length,
                revenue: totalCollected,
                revenueGoal: revenueGoal,
                feeProgress: feeProgress,
                upcomingExams: upcomingExams,
                latestNotices: latestNotices,
                attendance: attendancePercent,
                recentActivity: logs.slice(0, 5)
            }
        };
    }
};

// Initialize data on load
API.init();
