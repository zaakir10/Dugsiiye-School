/**
 * Notices Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    loadNotices();

    // Form Submit
    const noticeForm = document.getElementById('noticeForm');
    if (noticeForm) {
        noticeForm.addEventListener('submit', handleFormSubmit);
    }
});

async function loadNotices() {
    const grid = document.getElementById('noticesGrid');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');

    if (!grid) return;

    grid.innerHTML = '';
    loading.style.display = 'block';
    noData.style.display = 'none';

    try {
        const response = await API.get('notices');
        let notices = response.data;

        loading.style.display = 'none';

        if (notices.length === 0) {
            noData.style.display = 'block';
            return;
        }

        // Sort by date desc
        notices.sort((a, b) => new Date(b.date) - new Date(a.date));

        notices.forEach(notice => {
            const card = document.createElement('div');
            card.className = 'notice-card';

            let tagClass = 'tag-general';
            if (notice.category === 'Urgent') tagClass = 'tag-urgent';
            if (notice.category === 'Event') tagClass = 'tag-event';

            card.innerHTML = `
                <div class="notice-header">
                    <span class="notice-tag ${tagClass}">${notice.category}</span>
                    <button class="icon-btn" onclick="deleteNotice(${notice.id})" style="font-size: 1rem; color: var(--text-muted);"><i class='bx bx-x'></i></button>
                </div>
                <div class="notice-title">${notice.title}</div>
                <div class="notice-content">${notice.content}</div>
                <div class="notice-footer">
                    <span><i class='bx bx-time-five'></i> ${Utils.formatDate(notice.date)}</span>
                    <span>By Admin</span>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading notices:', error);
        loading.style.display = 'none';
        Utils.showToast('Error loading notices', 'error');
    }
}

// Modal Functions
function openModal() {
    const modal = document.getElementById('noticeModal');
    const form = document.getElementById('noticeForm');
    form.reset();
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('noticeModal').classList.remove('active');
}

window.onclick = function (event) {
    const modal = document.getElementById('noticeModal');
    if (event.target === modal) {
        closeModal();
    }
};

async function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('noticeTitle').value;
    const category = document.getElementById('noticeCategory').value;
    const content = document.getElementById('noticeContent').value;
    const date = new Date().toISOString();

    const noticeData = {
        title, category, content, date
    };

    try {
        await API.post('notices', noticeData);
        Utils.showToast('Notice posted successfully', 'success');

        closeModal();
        loadNotices();

    } catch (error) {
        Utils.showToast('Error posting notice', 'error');
    }
}

async function deleteNotice(id) {
    if (confirm('Are you sure you want to delete this notice?')) {
        try {
            const response = await API.get('notices');
            const notices = response.data.filter(n => n.id != id);
            localStorage.setItem('sms_notices', JSON.stringify(notices));

            Utils.showToast('Notice deleted successfully', 'success');
            loadNotices();
        } catch (error) {
            Utils.showToast('Error deleting notice', 'error');
        }
    }
}
