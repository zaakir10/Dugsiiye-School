/**
 * Subjects Management Logic
 */

let allSubjects = [];

document.addEventListener('DOMContentLoaded', () => {
    loadSubjects();

    // Form Submission
    document.getElementById('subjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSubject();
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadSubjects();
        }, 300));
    }
});

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

async function loadSubjects() {
    const tableBody = document.getElementById('subjectsTableBody');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    if (!tableBody) return;

    try {
        loading.style.display = 'block';
        tableBody.innerHTML = '';
        noData.style.display = 'none';

        const response = await API.get('subjects');
        if (response.success) {
            allSubjects = response.data;

            const filteredSubjects = allSubjects.filter(subject =>
                subject.name.toLowerCase().includes(searchInput) ||
                subject.code.toLowerCase().includes(searchInput)
            );

            if (filteredSubjects.length === 0) {
                noData.style.display = 'block';
            } else {
                if (document.getElementById('totalSubjectsCount')) {
                    document.getElementById('totalSubjectsCount').textContent = allSubjects.length;
                }
                filteredSubjects.forEach(subject => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <div style="font-weight: 500;">${subject.name}</div>
                        </td>
                        <td><span class="badge" style="background: #e0e7ff; color: #4338ca;">${subject.code}</span></td>
                        <td>${subject.type}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="icon-btn" onclick="editSubject('${subject.id}')"><i class='bx bx-edit'></i></button>
                                <button class="icon-btn" onclick="deleteSubject('${subject.id}')"><i class='bx bx-trash' style="color: var(--danger-color);"></i></button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        Utils.showToast('Failed to load subjects', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

// Modal Functions
function openModal() {
    document.getElementById('subjectModal').classList.add('active');
    document.getElementById('modalTitle').textContent = 'Add New Subject';
    document.getElementById('subjectForm').reset();
    document.getElementById('subjectId').value = '';
}

function closeModal() {
    document.getElementById('subjectModal').classList.remove('active');
}

// Edit Subject
function editSubject(id) {
    const subject = allSubjects.find(s => s.id == id);
    if (subject) {
        document.getElementById('subjectId').value = subject.id;
        document.getElementById('subjectName').value = subject.name;
        document.getElementById('subjectCode').value = subject.code;
        document.getElementById('subjectType').value = subject.type;

        document.getElementById('modalTitle').textContent = 'Edit Subject';
        document.getElementById('subjectModal').classList.add('active');
    }
}

// Save Subject
async function saveSubject() {
    const id = document.getElementById('subjectId').value;
    const name = document.getElementById('subjectName').value;
    const code = document.getElementById('subjectCode').value;
    const type = document.getElementById('subjectType').value;

    const subjectData = { name, code, type };

    try {
        let response;
        if (id) {
            // Update existing
            // Since API.post is generic and just pushes, we need to handle update manually in this mock
            // Ideally API should have put/update. For now, we'll do it manually here for mock purposes.

            const subjects = JSON.parse(localStorage.getItem('sms_subjects') || '[]');
            const index = subjects.findIndex(s => s.id == id);
            if (index !== -1) {
                subjects[index] = { ...subjects[index], ...subjectData };
                localStorage.setItem('sms_subjects', JSON.stringify(subjects));
                response = { success: true };
            } else {
                throw new Error('Subject not found');
            }
        } else {
            // Create new
            response = await API.post('subjects', subjectData);
        }

        if (response.success) {
            Utils.showToast(`Subject ${id ? 'updated' : 'added'} successfully`, 'success');
            closeModal();
            loadSubjects();
        }
    } catch (error) {
        console.error('Error saving subject:', error);
        Utils.showToast('Failed to save subject', 'error');
    }
}

// Delete Subject
async function deleteSubject(id) {
    if (confirm('Are you sure you want to delete this subject?')) {
        try {
            // Mock delete
            const subjects = JSON.parse(localStorage.getItem('sms_subjects') || '[]');
            const newSubjects = subjects.filter(s => s.id != id);
            localStorage.setItem('sms_subjects', JSON.stringify(newSubjects));

            Utils.showToast('Subject deleted successfully', 'success');
            loadSubjects();
        } catch (error) {
            console.error('Error deleting subject:', error);
            Utils.showToast('Failed to delete subject', 'error');
        }
    }
}

// Close modal when clicking outside
document.addEventListener('click', (event) => {
    const modal = document.getElementById('subjectModal');
    if (event.target === modal) {
        closeModal();
    }
});
