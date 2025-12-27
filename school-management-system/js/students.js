/**
 * Student Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    loadClassesForDropdown();

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            loadStudents(e.target.value);
        }, 300));
    }

    // Form Submit
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', handleFormSubmit);
    }

    // File Upload Handler
    const photoInput = document.getElementById('studentPhoto');
    if (photoInput) {
        photoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById('studentPhotoBase64').value = e.target.result;
                    const preview = document.getElementById('photoPreview');
                    preview.style.display = 'block';
                    preview.querySelector('img').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

async function loadClassesForDropdown() {
    try {
        const response = await API.get('classes');
        const select = document.getElementById('studentClass');
        if (select) {
            select.innerHTML = '<option value="">Select Class</option>';
            response.data.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.name;
                option.textContent = cls.name;
                select.appendChild(option);
            });

            if (response.data.length === 0) {
                select.innerHTML = '<option value="">No classes found</option>';
            }
        }
    } catch (error) {
        console.error('Error loading classes:', error);
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

async function loadStudents(query = '') {
    const tableBody = document.getElementById('studentsTableBody');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');

    if (!tableBody) return;

    tableBody.innerHTML = '';
    loading.style.display = 'block';
    noData.style.display = 'none';

    try {
        const response = await API.get('students');
        let students = response.data;

        // Filter if query exists
        if (query) {
            const lowerQuery = query.toLowerCase();
            students = students.filter(s =>
                s.name.toLowerCase().includes(lowerQuery) ||
                s.email.toLowerCase().includes(lowerQuery) ||
                s.roll.toLowerCase().includes(lowerQuery)
            );
        }

        loading.style.display = 'none';

        if (students.length === 0) {
            noData.style.display = 'block';
            return;
        }

        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="student-cell">
                        <img src="${student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}" alt="${student.name}">
                        <div>
                            <div style="font-weight: 500;">${student.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${student.email}</div>
                        </div>
                    </div>
                </td>
                <td>${student.roll}</td>
                <td>${student.class}</td>
                <td>${student.parentName}</td>
                <td><span class="status-badge ${student.status === 'Active' ? 'status-active' : 'status-inactive'}">${student.status}</span></td>
                <td>
                    <button class="icon-btn" onclick="editStudent(${student.id})"><i class='bx bx-edit'></i></button>
                    <button class="icon-btn" onclick="deleteStudent(${student.id})" style="color: var(--danger-color);"><i class='bx bx-trash'></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading students:', error);
        loading.style.display = 'none';
        Utils.showToast('Error loading students', 'error');
    }
}

// Modal Functions
function openModal(editMode = false) {
    const modal = document.getElementById('studentModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('studentForm');

    if (!editMode) {
        form.reset();
        document.getElementById('studentId').value = '';
        document.getElementById('studentPhoto').value = '';
        document.getElementById('studentPhotoBase64').value = '';
        document.getElementById('photoPreview').style.display = 'none';
        title.textContent = 'Add New Student';
    } else {
        title.textContent = 'Edit Student';
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('studentModal').classList.remove('active');
}

// Close modal on outside click
window.onclick = function (event) {
    const modal = document.getElementById('studentModal');
    if (event.target === modal) {
        closeModal();
    }
};

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('studentId').value;
    const name = document.getElementById('studentName').value;
    const email = document.getElementById('studentEmail').value;
    const className = document.getElementById('studentClass').value;
    const roll = document.getElementById('studentRoll').value;
    const parentName = document.getElementById('parentName').value;
    const status = document.getElementById('studentStatus').value;
    const avatar = document.getElementById('studentPhotoBase64').value;

    const studentData = {
        name, email, class: className, roll, parentName, status, avatar
    };

    try {
        if (id) {
            // Edit existing
            await API.put('students', id, studentData);
            Utils.showToast('Student updated successfully', 'success');
        } else {
            // Add new
            await API.post('students', studentData);
            Utils.showToast('Student added successfully', 'success');
        }

        closeModal();
        loadStudents();

    } catch (error) {
        Utils.showToast('Error saving student', 'error');
    }
}

async function editStudent(id) {
    try {
        const response = await API.get('students');
        const student = response.data.find(s => s.id == id);

        if (student) {
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentEmail').value = student.email;
            document.getElementById('studentClass').value = student.class;
            document.getElementById('studentRoll').value = student.roll;
            document.getElementById('parentName').value = student.parentName;
            document.getElementById('studentStatus').value = student.status;
            document.getElementById('studentPhotoBase64').value = student.avatar || '';

            const preview = document.getElementById('photoPreview');
            if (student.avatar) {
                preview.style.display = 'block';
                preview.querySelector('img').src = student.avatar;
            } else {
                preview.style.display = 'none';
            }

            openModal(true);
        }
    } catch (error) {
        Utils.showToast('Error fetching student details', 'error');
    }
}

async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            await API.delete('students', id);
            Utils.showToast('Student deleted successfully', 'success');
            loadStudents();
        } catch (error) {
            Utils.showToast('Error deleting student', 'error');
        }
    }
}
