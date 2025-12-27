
document.addEventListener('DOMContentLoaded', () => {
    loadClasses();
    loadTeachersForDropdown();

    // Form Submit
    const classForm = document.getElementById('classForm');
    if (classForm) {
        classForm.addEventListener('submit', handleFormSubmit);
    }
});

async function loadClasses() {
    const grid = document.getElementById('classesGrid');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');

    if (!grid) return;

    grid.innerHTML = '';
    loading.style.display = 'block';
    noData.style.display = 'none';

    try {
        const [classesRes, studentsRes, teachersRes] = await Promise.all([
            API.get('classes'),
            API.get('students'),
            API.get('teachers')
        ]);

        const classes = classesRes.data;
        const students = studentsRes.data;
        const teachers = teachersRes.data;

        loading.style.display = 'none';

        if (classes.length === 0) {
            noData.style.display = 'block';
            return;
        }

        classes.forEach(cls => {
            // Calculate stats
            const studentCount = students.filter(s => s.class === cls.name).length;
            const teacherName = teachers.find(t => t.id == cls.teacherId)?.name || 'Unassigned';

            const card = document.createElement('div');
            card.className = 'class-card';
            card.innerHTML = `
                <div class="class-header">
                    <div class="class-name">${cls.name}</div>
                    <div class="dropdown">
                        <button class="icon-btn"><i class='bx bx-dots-vertical-rounded'></i></button>
                    </div>
                </div>
                <div class="class-teacher">
                    <i class='bx bxs-user-badge'></i> ${teacherName}
                </div>
                <div class="class-stats">
                    <div class="stat-item">
                        <div class="stat-value">${studentCount}</div>
                        <div class="stat-label">Students</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${cls.capacity || 30}</div>
                        <div class="stat-label">Capacity</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${cls.room || 'N/A'}</div>
                        <div class="stat-label">Room</div>
                    </div>
                </div>
                <div class="class-actions">
                    <button class="btn btn-primary" style="flex: 1; font-size: 0.75rem;" onclick="editClass(${cls.id})">Edit</button>
                    <button class="btn" style="flex: 1; font-size: 0.75rem; border: 1px solid var(--danger-color); color: var(--danger-color);" onclick="deleteClass(${cls.id})">Delete</button>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading classes:', error);
        loading.style.display = 'none';
        Utils.showToast('Error loading classes', 'error');
    }
}

async function loadTeachersForDropdown() {
    try {
        const response = await API.get('teachers');
        const select = document.getElementById('classTeacher');
        if (select) {
            select.innerHTML = '<option value="">Select Teacher</option>';
            response.data.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading teachers for dropdown:', error);
    }
}

// Modal Functions
function openModal(editMode = false) {
    const modal = document.getElementById('classModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('classForm');

    if (!editMode) {
        form.reset();
        document.getElementById('classId').value = '';
        title.textContent = 'Add New Class';
    } else {
        title.textContent = 'Edit Class';
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('classModal').classList.remove('active');
}

window.onclick = function (event) {
    const modal = document.getElementById('classModal');
    if (event.target === modal) {
        closeModal();
    }
};

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('classId').value;
    const name = document.getElementById('className').value;
    const teacherId = document.getElementById('classTeacher').value;
    const room = document.getElementById('classRoom').value;
    const capacity = document.getElementById('classCapacity').value;

    const classData = {
        name, teacherId, room, capacity
    };

    try {
        if (id) {
            // Update
            await API.put('classes', id, classData);
            Utils.showToast('Class updated successfully', 'success');
        } else {
            // Add new
            await API.post('classes', classData);
            Utils.showToast('Class added successfully', 'success');
        }

        closeModal();
        loadClasses();

    } catch (error) {
        Utils.showToast('Error saving class', 'error');
    }
}

async function editClass(id) {
    try {
        const response = await API.get('classes');
        const cls = response.data.find(c => c.id == id);

        if (cls) {
            document.getElementById('classId').value = cls.id;
            document.getElementById('className').value = cls.name;
            document.getElementById('classTeacher').value = cls.teacherId;
            document.getElementById('classRoom').value = cls.room;
            document.getElementById('classCapacity').value = cls.capacity;

            openModal(true);
        }
    } catch (error) {
        Utils.showToast('Error fetching class details', 'error');
    }
}

async function deleteClass(id) {
    if (confirm('Are you sure you want to delete this class?')) {
        try {
            await API.delete('classes', id);
            Utils.showToast('Class deleted successfully', 'success');
            loadClasses();
        } catch (error) {
            Utils.showToast('Error deleting class', 'error');
        }
    }
}
