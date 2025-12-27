/**
 * Attendance Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
        // Set max date to today to prevent future attendance
        dateInput.max = new Date().toISOString().split('T')[0];
    }

    loadClasses();
});

async function loadClasses() {
    try {
        const response = await API.get('classes');
        const select = document.getElementById('classSelect');
        if (select) {
            select.innerHTML = '<option value="">Choose a class</option>';
            response.data.forEach(c => {
                const option = document.createElement('option');
                option.value = c.name;
                option.textContent = c.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        Utils.showToast('Error loading classes', 'error');
    }
}

async function loadAttendance() {
    const className = document.getElementById('classSelect').value;
    const date = document.getElementById('attendanceDate').value;

    if (!className || !date) {
        Utils.showToast('Please select class and date', 'error');
        return;
    }

    const content = document.getElementById('attendanceContent');
    const grid = document.getElementById('studentsGrid');
    const loading = document.getElementById('loading');
    const initialState = document.getElementById('initialState');

    initialState.style.display = 'none';
    content.style.display = 'none';
    loading.style.display = 'block';
    grid.innerHTML = '';

    try {
        // Get Students for class
        const studentsRes = await API.get('students');
        const students = studentsRes.data.filter(s => s.class === className);

        // Get existing attendance record
        const recordKey = `attendance_${date}_${className}`;
        const existingRecord = JSON.parse(localStorage.getItem(`sms_${recordKey}`) || '{}');

        loading.style.display = 'none';
        content.style.display = 'block';

        if (students.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class='bx bx-user-x' style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>No students found in class ${className}</p>
                </div>
            `;
            return;
        }

        students.forEach(student => {
            const status = existingRecord[student.id] || ''; // Empty if not marked

            const card = document.createElement('div');
            card.className = 'student-attendance-card';
            card.innerHTML = `
                <img src="${student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}" alt="${student.name}">
                <div style="font-weight: 600; font-size: 0.95rem;">${student.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem;">Roll: ${student.roll}</div>
                
                <div class="attendance-actions" data-student-id="${student.id}">
                    <button class="btn-attendance btn-present ${status === 'present' ? 'active' : ''}" onclick="markStatus(this, 'present')">
                        <i class='bx bx-check'></i> Present
                    </button>
                    <button class="btn-attendance btn-absent ${status === 'absent' ? 'active' : ''}" onclick="markStatus(this, 'absent')">
                        <i class='bx bx-x'></i> Absent
                    </button>
                    <button class="btn-attendance btn-late ${status === 'late' ? 'active' : ''}" onclick="markStatus(this, 'late')" style="flex: 0.8; font-size: 0.75rem;">
                        Late
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading data:', error);
        loading.style.display = 'none';
        Utils.showToast('Error loading attendance list', 'error');
    }
}

function markStatus(btn, status) {
    const parent = btn.parentElement;
    const buttons = parent.querySelectorAll('.btn-attendance');

    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function markAll(status) {
    const grid = document.getElementById('studentsGrid');
    const containers = grid.querySelectorAll('.attendance-actions');

    containers.forEach(container => {
        const buttons = container.querySelectorAll('.btn-attendance');
        buttons.forEach(b => b.classList.remove('active'));

        const targetBtn = container.querySelector(`.btn-${status}`);
        if (targetBtn) targetBtn.classList.add('active');
    });

    Utils.showToast(`All students marked as ${status}`, 'info');
}

async function saveAttendance() {
    const className = document.getElementById('classSelect').value;
    const date = document.getElementById('attendanceDate').value;
    const actions = document.querySelectorAll('.attendance-actions');

    if (actions.length === 0) return;

    const attendanceData = {};
    let allMarked = true;

    actions.forEach(action => {
        const studentId = action.dataset.studentId;
        const activeBtn = action.querySelector('.btn-attendance.active');

        if (activeBtn) {
            if (activeBtn.classList.contains('btn-present')) status = 'present';
            else if (activeBtn.classList.contains('btn-absent')) status = 'absent';
            else if (activeBtn.classList.contains('btn-late')) status = 'late';
            attendanceData[studentId] = status;
        } else {
            allMarked = false;
        }
    });

    if (!allMarked) {
        if (!confirm('Some students are not marked. Save anyway?')) return;
    }

    try {
        const recordKey = `attendance_${date}_${className}`;
        localStorage.setItem(`sms_${recordKey}`, JSON.stringify(attendanceData));

        Utils.showToast('Attendance saved successfully', 'success');

        // Update global attendance list if we want to show history later
        let history = JSON.parse(localStorage.getItem('sms_attendance_history') || '[]');
        const existingIndex = history.findIndex(h => h.date === date && h.className === className);

        const summary = {
            date,
            className,
            timestamp: new Date().toISOString(),
            present: Object.values(attendanceData).filter(v => v === 'present').length,
            absent: Object.values(attendanceData).filter(v => v === 'absent').length,
            late: Object.values(attendanceData).filter(v => v === 'late').length,
            total: Object.keys(attendanceData).length
        };

        if (existingIndex !== -1) history[existingIndex] = summary;
        else history.push(summary);

        localStorage.setItem('sms_attendance_history', JSON.stringify(history));

    } catch (error) {
        console.error('Save error:', error);
        Utils.showToast('Error saving attendance', 'error');
    }
}
