/**
 * Exams Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    loadExams();
    loadClassesForDropdown();

    // Form Submit
    const examForm = document.getElementById('examForm');
    if (examForm) {
        examForm.addEventListener('submit', handleFormSubmit);
    }
});

async function loadExams() {
    const grid = document.getElementById('examsGrid');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');

    if (!grid) return;

    grid.innerHTML = '';
    loading.style.display = 'block';
    noData.style.display = 'none';

    try {
        const response = await API.get('exams');
        const exams = response.data;

        loading.style.display = 'none';

        if (exams.length === 0) {
            noData.style.display = 'block';
            return;
        }

        // Sort by date descending
        exams.sort((a, b) => new Date(b.date) - new Date(a.date));

        exams.forEach(exam => {
            const isCompleted = new Date(exam.date) < new Date();

            const card = document.createElement('div');
            card.className = 'exam-card';
            card.innerHTML = `
                <div class="exam-header">
                    <div class="exam-title">${exam.name}</div>
                    <span class="exam-status ${isCompleted ? 'status-completed' : 'status-upcoming'}">
                        ${isCompleted ? 'Completed' : 'Upcoming'}
                    </span>
                </div>
                <div style="margin-bottom: 0.5rem; font-weight: 500;">${exam.subject}</div>
                <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">Class: ${exam.className}</div>
                <div class="exam-date">
                    <i class='bx bx-calendar'></i> ${Utils.formatDate(exam.date)}
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" style="flex: 1; font-size: 0.8rem;" onclick="viewResults(${exam.id})">Results</button>
                    <button class="icon-btn" onclick="deleteExam(${exam.id})" style="color: var(--danger-color);"><i class='bx bx-trash'></i></button>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading exams:', error);
        loading.style.display = 'none';
        Utils.showToast('Error loading exams', 'error');
    }
}

async function loadClassesForDropdown() {
    try {
        const response = await API.get('classes');
        const select = document.getElementById('examClass');
        if (select) {
            select.innerHTML = '<option value="">Select Class</option>';
            response.data.forEach(c => {
                const option = document.createElement('option');
                option.value = c.name;
                option.textContent = c.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

// Modal Functions
function openModal() {
    const modal = document.getElementById('examModal');
    const form = document.getElementById('examForm');
    form.reset();
    document.getElementById('examId').value = '';
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('examModal').classList.remove('active');
}

window.onclick = function (event) {
    const modal = document.getElementById('examModal');
    if (event.target === modal) {
        closeModal();
    }
};

async function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('examName').value;
    const className = document.getElementById('examClass').value;
    const subject = document.getElementById('examSubject').value;
    const date = document.getElementById('examDate').value;

    const examData = {
        name, className, subject, date
    };

    try {
        await API.post('exams', examData);
        Utils.showToast('Exam scheduled successfully', 'success');

        closeModal();
        loadExams();

    } catch (error) {
        Utils.showToast('Error scheduling exam', 'error');
    }
}

async function deleteExam(id) {
    if (confirm('Are you sure you want to delete this exam?')) {
        try {
            const response = await API.get('exams');
            const exams = response.data.filter(e => e.id != id);
            localStorage.setItem('sms_exams', JSON.stringify(exams));

            Utils.showToast('Exam deleted successfully', 'success');
            loadExams();
        } catch (error) {
            Utils.showToast('Error deleting exam', 'error');
        }
    }
}

// Results Management
function viewResults(examId) {
    window.location.href = `results.html?examId=${examId}`;
}
