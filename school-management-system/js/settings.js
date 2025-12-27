/**
 * Settings Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadUsers(); // Load system users list

    // Form Submissions
    document.getElementById('generalForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveGeneralSettings();
    });

    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateProfile();
    });

    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
});

/**
 * Tab Management
 */
function switchTab(tabId) {
    // Update Nav
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const clickedItem = Array.from(document.querySelectorAll('.settings-nav-item')).find(item =>
        item.getAttribute('onclick').includes(`'${tabId}'`)
    );
    if (clickedItem) clickedItem.classList.add('active');

    // Update Content
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    // Special logic for tabs
    if (tabId === 'users') {
        loadUsers();
    }
}

/**
 * General School Settings
 */
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('sms_settings')) || {};

    if (settings.schoolName) document.getElementById('schoolName').value = settings.schoolName;
    if (settings.phone) document.getElementById('schoolPhone').value = settings.phone;
    if (settings.email) document.getElementById('schoolEmail').value = settings.email;
    if (settings.address) document.getElementById('schoolAddress').value = settings.address;
    if (settings.academicYear) document.getElementById('academicYear').value = settings.academicYear;

    // Load Profile Data
    const session = JSON.parse(localStorage.getItem('sms_session'));
    if (session && session.user) {
        if (document.getElementById('profileName')) document.getElementById('profileName').value = session.user.name;
        if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = session.user.email;
    }
}

function saveGeneralSettings() {
    const settings = {
        schoolName: document.getElementById('schoolName').value,
        phone: document.getElementById('schoolPhone').value,
        email: document.getElementById('schoolEmail').value,
        address: document.getElementById('schoolAddress').value,
        academicYear: document.getElementById('academicYear').value
    };

    localStorage.setItem('sms_settings', JSON.stringify(settings));
    Utils.showToast('Settings saved successfully', 'success');

    // Update logo text immediately
    const logoText = document.querySelector('.logo span');
    if (logoText && settings.schoolName) {
        logoText.textContent = settings.schoolName;
    }
}

/**
 * Personal Profile Management
 */
function updateProfile() {
    const fullName = document.getElementById('profileName').value;
    const passwordInputs = document.querySelectorAll('#profileForm input[type="password"]');
    const currentPassword = passwordInputs[0].value;
    const newPassword = passwordInputs[1].value;
    const confirmPassword = passwordInputs[2].value;

    const session = JSON.parse(localStorage.getItem('sms_session'));
    if (!session || !session.user) {
        Utils.showToast('Error: No active session', 'error');
        return;
    }

    let users = JSON.parse(localStorage.getItem('sms_users') || '[]');
    const userIndex = users.findIndex(u => u.email === session.user.email);

    if (userIndex === -1) {
        Utils.showToast('Error: User not found in database', 'error');
        return;
    }

    // Update Name
    users[userIndex].name = fullName;
    session.user.name = fullName;

    // Update Password if provided
    if (newPassword) {
        if (newPassword !== confirmPassword) {
            Utils.showToast('New passwords do not match', 'error');
            return;
        }
        users[userIndex].password = newPassword;
    }

    localStorage.setItem('sms_users', JSON.stringify(users));
    localStorage.setItem('sms_session', JSON.stringify(session));

    // Update UI
    const userNameDisplay = document.getElementById('userName');
    if (userNameDisplay) userNameDisplay.textContent = fullName;

    // Clear password fields
    passwordInputs.forEach(input => input.value = '');

    Utils.showToast('Profile updated successfully', 'success');
}

/**
 * System Users Management
 */
function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    const users = JSON.parse(localStorage.getItem('sms_users') || '[]');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}" 
                         style="width: 32px; height: 32px; border-radius: 50%;">
                    <div>
                        <div style="font-weight: 500;">${user.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge" style="background: #f3f4f6; color: #374151; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; text-transform: capitalize;">${user.role}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="icon-btn" onclick="editUser(${user.id})"><i class='bx bx-edit'></i></button>
                    <button class="icon-btn" onclick="deleteUser(${user.id})" style="color: var(--danger-color);"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function openUserModal() {
    document.getElementById('userModal').classList.add('active');
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('editUserId').value = '';
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function editUser(id) {
    const users = JSON.parse(localStorage.getItem('sms_users') || '[]');
    const user = users.find(u => u.id == id);
    if (!user) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('userFullName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userRoleSelect').value = user.role;
    document.getElementById('userPassword').value = '';

    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userModal').classList.add('active');
}

async function handleUserSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    const name = document.getElementById('userFullName').value;
    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRoleSelect').value;
    const password = document.getElementById('userPassword').value;

    let users = JSON.parse(localStorage.getItem('sms_users') || '[]');

    if (id) {
        // Update
        const index = users.findIndex(u => u.id == id);
        if (index !== -1) {
            users[index].name = name;
            users[index].email = email;
            users[index].role = role;
            if (password) users[index].password = password;
        }
    } else {
        // Add
        const newUser = {
            id: Date.now(),
            name,
            email,
            role,
            password: password || '123',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        };
        users.push(newUser);
    }

    localStorage.setItem('sms_users', JSON.stringify(users));
    Utils.showToast(`User ${id ? 'updated' : 'added'} successfully`, 'success');
    closeUserModal();
    loadUsers();
}

function deleteUser(id) {
    const session = JSON.parse(localStorage.getItem('sms_session'));
    if (session && session.user && session.user.id == id) {
        Utils.showToast('You cannot delete your own account while logged in', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
        let users = JSON.parse(localStorage.getItem('sms_users') || '[]');
        users = users.filter(u => u.id != id);
        localStorage.setItem('sms_users', JSON.stringify(users));
        Utils.showToast('User deleted successfully', 'success');
        loadUsers();
    }
}

/**
 * Data Backup & Reset
 */
function exportData() {
    const data = {
        users: JSON.parse(localStorage.getItem('sms_users') || '[]'),
        students: JSON.parse(localStorage.getItem('sms_students') || '[]'),
        teachers: JSON.parse(localStorage.getItem('sms_teachers') || '[]'),
        classes: JSON.parse(localStorage.getItem('sms_classes') || '[]'),
        subjects: JSON.parse(localStorage.getItem('sms_subjects') || '[]'),
        attendance: JSON.parse(localStorage.getItem('sms_attendance') || '[]'),
        exams: JSON.parse(localStorage.getItem('sms_exams') || '[]'),
        results: JSON.parse(localStorage.getItem('sms_results') || '[]'),
        fees: JSON.parse(localStorage.getItem('sms_fees') || '[]'),
        notices: JSON.parse(localStorage.getItem('sms_notices') || '[]'),
        settings: JSON.parse(localStorage.getItem('sms_settings') || '{}'),
        timestamp: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "sms_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    Utils.showToast('Data exported successfully', 'success');
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.timestamp) throw new Error('Invalid backup file');

            if (confirm('This will overwrite all current data. Are you sure?')) {
                Object.keys(data).forEach(key => {
                    if (key !== 'timestamp') {
                        localStorage.setItem(`sms_${key}`, JSON.stringify(data[key]));
                    }
                });
                Utils.showToast('Data imported successfully. Reloading...', 'success');
                setTimeout(() => location.reload(), 1500);
            }
        } catch (error) {
            Utils.showToast('Failed to import data: Invalid file', 'error');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

function resetSystem() {
    if (confirm('WARNING: This will delete ALL data (students, teachers, results, etc.). ARE YOU SURE?')) {
        const confirm2 = prompt('Type "DELETE" to confirm:');
        if (confirm2 === 'DELETE') {
            localStorage.clear();
            Utils.showToast('System reset complete. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    }
}
