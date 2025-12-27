/**
 * Fees Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    loadFees();
    loadStudentsForDropdown();

    // Default date
    const dateInput = document.getElementById('feeDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    // Form Submit
    const feeForm = document.getElementById('feeForm');
    if (feeForm) {
        feeForm.addEventListener('submit', handleFormSubmit);
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            loadFees(e.target.value);
        }, 300));
    }
});

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

// Global students storage to avoid refetching on every row render if needed
let systemStudents = [];

async function loadStudentsForDropdown() {
    try {
        const response = await API.get('students');
        systemStudents = response.data;
        const select = document.getElementById('feeStudent');
        if (select) {
            select.innerHTML = '<option value="">Select Student</option>';
            systemStudents.forEach(s => {
                const option = document.createElement('option');
                option.value = s.id;
                option.textContent = `${s.name} (${s.class})`;
                option.dataset.name = s.name;
                option.dataset.class = s.class;
                select.appendChild(option);
            });

            if (systemStudents.length === 0) {
                select.innerHTML = '<option value="">No students found</option>';
            }
        }
    } catch (error) {
        console.error('Error loading students for dropdown:', error);
    }
}

async function loadFees(query = '') {
    const tableBody = document.getElementById('feesTableBody');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');

    if (!tableBody) return;

    tableBody.innerHTML = '';
    loading.style.display = 'block';
    noData.style.display = 'none';

    try {
        const response = await API.get('fees');
        let fees = response.data;

        // Filter
        if (query) {
            const lowerQuery = query.toLowerCase();
            fees = fees.filter(f => f.studentName.toLowerCase().includes(lowerQuery));
        }

        loading.style.display = 'none';

        if (fees.length === 0) {
            noData.style.display = 'block';
            return;
        }

        // Sort by date desc
        fees.sort((a, b) => new Date(b.date) - new Date(a.date));

        fees.forEach(fee => {
            const row = document.createElement('tr');

            let statusClass = 'status-pending';
            if (fee.status === 'Paid') statusClass = 'status-paid';
            if (fee.status === 'Overdue') statusClass = 'status-overdue';

            row.innerHTML = `
                <td style="font-weight: 500;">${fee.studentName}</td>
                <td>${fee.className || 'N/A'}</td>
                <td>${fee.type}</td>
                <td>${Utils.formatCurrency(fee.amount)}</td>
                <td>${Utils.formatDate(fee.date)}</td>
                <td><span class="fee-status ${statusClass}">${fee.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn" onclick="editFee('${fee.id}')"><i class='bx bx-edit'></i></button>
                        <button class="icon-btn" onclick="deleteFee('${fee.id}')" style="color: var(--danger-color);"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading fees:', error);
        loading.style.display = 'none';
        Utils.showToast('Error loading fees', 'error');
    }
}

// Modal Functions
function openModal(editMode = false) {
    const modal = document.getElementById('feeModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('feeForm');

    if (!editMode) {
        form.reset();
        document.getElementById('feeId').value = '';
        document.getElementById('feeDate').valueAsDate = new Date();
        if (title) title.textContent = 'Record Payment';
    } else {
        if (title) title.textContent = 'Edit Payment Record';
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('feeModal').classList.remove('active');
}

window.onclick = function (event) {
    const modal = document.getElementById('feeModal');
    if (event.target === modal) {
        closeModal();
    }
};

async function editFee(id) {
    try {
        const response = await API.get('fees');
        const fee = response.data.find(f => f.id == id);

        if (fee) {
            document.getElementById('feeId').value = fee.id;
            document.getElementById('feeStudent').value = fee.studentId;
            document.getElementById('feeType').value = fee.type;
            document.getElementById('feeAmount').value = fee.amount;
            document.getElementById('feeDate').value = fee.date;
            document.getElementById('feeStatus').value = fee.status;

            openModal(true);
        }
    } catch (error) {
        Utils.showToast('Error fetching fee details', 'error');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('feeId').value;
    const studentSelect = document.getElementById('feeStudent');
    const selectedOption = studentSelect.options[studentSelect.selectedIndex];

    if (!selectedOption || !selectedOption.value) {
        Utils.showToast('Please select a student', 'error');
        return;
    }

    const studentId = selectedOption.value;
    const studentName = selectedOption.dataset.name;
    const className = selectedOption.dataset.class;

    const type = document.getElementById('feeType').value;
    const amount = document.getElementById('feeAmount').value;
    const date = document.getElementById('feeDate').value;
    const status = document.getElementById('feeStatus').value;

    const feeData = {
        studentId, studentName, type, amount, date, status, className
    };

    try {
        if (id) {
            await API.put('fees', id, feeData);
            Utils.showToast('Payment record updated successfully', 'success');
        } else {
            await API.post('fees', feeData);
            Utils.showToast('Payment recorded successfully', 'success');
        }

        closeModal();
        loadFees();

    } catch (error) {
        Utils.showToast('Error saving payment record', 'error');
    }
}

async function deleteFee(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        try {
            const response = await API.get('fees');
            const fees = response.data.filter(f => f.id != id);
            localStorage.setItem('sms_fees', JSON.stringify(fees));

            Utils.showToast('Record deleted successfully', 'success');
            loadFees();
        } catch (error) {
            Utils.showToast('Error deleting record', 'error');
        }
    }
}
