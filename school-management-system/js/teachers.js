/**
 * Teacher Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    loadTeachers();
    loadSubjectsForDropdown();
    updateTotalTeachersCount();

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            loadTeachers(e.target.value);
        }, 300));
    }

    // Form Submit
    const teacherForm = document.getElementById('teacherForm');
    if (teacherForm) {
        teacherForm.addEventListener('submit', handleFormSubmit);
    }
});

async function updateTotalTeachersCount() {
    try {
        const response = await API.get('teachers');
        const countEl = document.getElementById('totalTeachersCount');
        if (countEl) countEl.textContent = response.data.length;
    } catch (error) {
        console.error('Error updating teacher count:', error);
    }
}

async function loadSubjectsForDropdown() {
    try {
        const response = await API.get('subjects');
        const select = document.getElementById('teacherSubject');
        if (select) {
            select.innerHTML = '<option value="">Select Subject</option>';
            response.data.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.name;
                option.textContent = `${sub.name} (${sub.code})`;
                select.appendChild(option);
            });

            if (response.data.length === 0) {
                select.innerHTML = '<option value="">No subjects found</option>';
            }
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function loadTeachers(query = '') {
    const tableBody = document.getElementById('teachersTableBody');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');

    if (!tableBody) return;

    tableBody.innerHTML = '';
    loading.style.display = 'block';
    noData.style.display = 'none';

    try {
        // Fetch both teachers and subjects to get the codes
        const [teachersRes, subjectsRes] = await Promise.all([
            API.get('teachers'),
            API.get('subjects')
        ]);

        let teachers = teachersRes.data;
        const subjectsMap = {};
        subjectsRes.data.forEach(sub => {
            subjectsMap[sub.name] = sub.code;
        });

        // Filter if query exists
        if (query) {
            const lowerQuery = query.toLowerCase();
            teachers = teachers.filter(t =>
                t.name.toLowerCase().includes(lowerQuery) ||
                t.subject.toLowerCase().includes(lowerQuery)
            );
        }

        loading.style.display = 'none';

        if (teachers.length === 0) {
            noData.style.display = 'block';
            return;
        }

        teachers.forEach(teacher => {
            const subjectCode = subjectsMap[teacher.subject] || '---';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="teacher-cell">
                        <img src="${teacher.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random`}" alt="${teacher.name}">
                        <div>
                            <div style="font-weight: 500;">${teacher.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${teacher.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 500;">${teacher.subject}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${subjectCode}</div>
                </td>
                <td>${teacher.phone}</td>
                <td>${Utils.formatDate(teacher.joinDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn" onclick="editTeacher('${teacher.id}')"><i class='bx bx-edit'></i></button>
                        <button class="icon-btn" onclick="deleteTeacher('${teacher.id}')" style="color: var(--danger-color);"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading teachers:', error);
        loading.style.display = 'none';
        Utils.showToast('Error loading teachers', 'error');
    }
}

// Modal Functions
function openModal(editMode = false) {
    const modal = document.getElementById('teacherModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('teacherForm');

    if (!editMode) {
        form.reset();
        document.getElementById('teacherId').value = '';
        // Default date to today
        document.getElementById('teacherJoinDate').valueAsDate = new Date();
        title.textContent = 'Add New Teacher';
    } else {
        title.textContent = 'Edit Teacher';
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('teacherModal').classList.remove('active');
}

window.onclick = function (event) {
    const modal = document.getElementById('teacherModal');
    if (event.target === modal) {
        closeModal();
    }
};

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('teacherId').value;
    const name = document.getElementById('teacherName').value;
    const email = document.getElementById('teacherEmail').value;
    const subject = document.getElementById('teacherSubject').value;
    const phone = document.getElementById('teacherPhone').value;
    const joinDate = document.getElementById('teacherJoinDate').value;

    const teacherData = {
        name, email, subject, phone, joinDate
    };

    try {
        if (id) {
            // Update
            await API.put('teachers', id, teacherData);
            Utils.showToast('Teacher updated successfully', 'success');
        } else {
            // Add new
            await API.post('teachers', teacherData);
            Utils.showToast('Teacher added successfully', 'success');
        }

        closeModal();
        loadTeachers();
        updateTotalTeachersCount();

    } catch (error) {
        Utils.showToast('Error saving teacher', 'error');
    }
}

async function editTeacher(id) {
    try {
        const response = await API.get('teachers');
        const teacher = response.data.find(t => t.id == id);

        if (teacher) {
            document.getElementById('teacherId').value = teacher.id;
            document.getElementById('teacherName').value = teacher.name;
            document.getElementById('teacherEmail').value = teacher.email;
            document.getElementById('teacherSubject').value = teacher.subject;
            document.getElementById('teacherPhone').value = teacher.phone;
            document.getElementById('teacherJoinDate').value = teacher.joinDate;

            openModal(true);
        }
    } catch (error) {
        Utils.showToast('Error fetching teacher details', 'error');
    }
}

async function deleteTeacher(id) {
    if (confirm('Are you sure you want to delete this teacher?')) {
        try {
            await API.delete('teachers', id);
            Utils.showToast('Teacher deleted successfully', 'success');
            loadTeachers();
            updateTotalTeachersCount();
        } catch (error) {
            Utils.showToast('Error deleting teacher', 'error');
        }
    }
}
