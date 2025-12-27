

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Dashboard Stats (only if on dashboard)
    if (document.getElementById('totalStudents')) {
        initDashboard();
    }

    // Load User Info (runs on all pages)
    loadUserInfo();
    loadSystemSettings();

    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = themeToggle.querySelector('i');
            if (document.body.classList.contains('dark-mode')) {
                icon.classList.replace('bx-moon', 'bx-sun');
                localStorage.setItem('sms_theme', 'dark');
            } else {
                icon.classList.replace('bx-sun', 'bx-moon');
                localStorage.setItem('sms_theme', 'light');
            }
        });

        // Check saved theme
        if (localStorage.getItem('sms_theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.querySelector('i').classList.replace('bx-moon', 'bx-sun');
        }
    }
});

async function initDashboard() {
    try {
        // Load Stats
        const stats = await API.getStats();
        if (stats.success) {
            animateValue(document.getElementById('totalStudents'), 0, stats.data.students, 1000);
            animateValue(document.getElementById('totalTeachers'), 0, stats.data.teachers, 1000);
            animateValue(document.getElementById('totalClasses'), 0, stats.data.classes, 1000);
            const revenueEl = document.getElementById('totalRevenue');
            if (revenueEl) revenueEl.textContent = Utils.formatCurrency(stats.data.revenue);

            // Populate Recent Activity
            const activityList = document.getElementById('recentActivityList');
            if (activityList) {
                activityList.innerHTML = stats.data.recentActivity.length ?
                    stats.data.recentActivity.map(log => `
                        <li>
                            <div class="activity-icon ${log.type === 'success' ? 'bg-green-light' : 'bg-blue-light'}">
                                <i class='bx ${log.type === 'success' ? 'bx-check' : 'bx-info-circle'}'></i>
                            </div>
                            <div class="activity-details">
                                <p><strong>${log.message}</strong></p>
                                <span class="time">${new Date(log.time).toLocaleTimeString()}</span>
                            </div>
                        </li>
                    `).join('') : '<li style="justify-content: center; padding: 2rem; color: var(--text-muted);">No records yet</li>';
            }

            // Populate Upcoming Exams
            const examsList = document.getElementById('upcomingExamsList');
            if (examsList) {
                examsList.innerHTML = stats.data.upcomingExams.length ?
                    stats.data.upcomingExams.map(exam => `
                        <li>
                            <div class="activity-icon bg-blue-light"><i class='bx bx-edit'></i></div>
                            <div class="activity-details">
                                <p><strong>${exam.name}</strong> - ${exam.subject}</p>
                                <span class="time">${Utils.formatDate(exam.date)} • ${exam.className}</span>
                            </div>
                        </li>
                    `).join('') : '<li style="justify-content: center; padding: 2rem; color: var(--text-muted);">No upcoming exams</li>';
            }

            // Populate Latest Notices
            const noticesList = document.getElementById('latestNoticesList');
            if (noticesList) {
                noticesList.innerHTML = stats.data.latestNotices.length ?
                    stats.data.latestNotices.map(notice => `
                        <li>
                            <div class="activity-icon bg-orange-light"><i class='bx bx-bell'></i></div>
                            <div class="activity-details">
                                <p><strong>${notice.title}</strong></p>
                                <span class="time">${notice.category} • ${Utils.formatDate(notice.date)}</span>
                            </div>
                        </li>
                    `).join('') : '<li style="justify-content: center; padding: 2rem; color: var(--text-muted);">No recent notices</li>';
            }

            // Update Attendance Bar
            const presentPercent = document.getElementById('presentPercent');
            const presentBar = document.getElementById('presentBar');
            if (presentPercent && presentBar) {
                presentPercent.textContent = stats.data.attendance + '%';
                setTimeout(() => {
                    presentBar.style.width = stats.data.attendance + '%';
                }, 100);
            }

            // Update Fee Progress
            const feePercent = document.getElementById('feePercent');
            const feeBar = document.getElementById('feeBar');
            const revenueValue = document.getElementById('revenueValue');
            const revenueTarget = document.getElementById('revenueTarget');

            if (feePercent && feeBar) {
                if (revenueValue) revenueValue.textContent = Utils.formatCurrency(stats.data.revenue);
                if (revenueTarget) revenueTarget.textContent = Utils.formatCurrency(stats.data.revenueGoal);
                feePercent.textContent = stats.data.feeProgress + '%';
                setTimeout(() => {
                    feeBar.style.width = Math.min(stats.data.feeProgress, 100) + '%';
                }, 100);
            }
        }

    } catch (error) {
        console.error('Dashboard init error:', error);
        Utils.showToast('Failed to load dashboard data', 'error');
    }
}

function loadUserInfo() {
    const session = JSON.parse(localStorage.getItem('sms_session'));
    if (session && session.user) {
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const userAvatarEl = document.getElementById('userAvatar');

        if (userNameEl) userNameEl.textContent = session.user.name;
        if (userRoleEl) userRoleEl.textContent = session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1);
        if (userAvatarEl) userAvatarEl.src = session.user.avatar;
    }
}

function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function loadSystemSettings() {
    const settings = JSON.parse(localStorage.getItem('sms_settings'));
    if (settings && settings.schoolName) {
        const logoText = document.querySelector('.logo span');
        if (logoText) {
            logoText.textContent = settings.schoolName;
        }
    }
}
