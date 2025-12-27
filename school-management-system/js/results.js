/**
 * Results Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    loadExamsDropdown();

    // Check for URL param
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    if (examId) {
        // Wait a bit for dropdown to load then select it
        setTimeout(() => {
            const select = document.getElementById('examSelect');
            if (select) {
                select.value = examId;
                loadExamResults();
            }
        }, 500);
    }
});

let currentExamId = null;

async function loadExamsDropdown() {
    try {
        const response = await API.get('exams');
        const exams = response.data;
        const select = document.getElementById('examSelect');

        // Sort by date desc
        exams.sort((a, b) => new Date(b.date) - new Date(a.date));

        exams.forEach(exam => {
            const option = document.createElement('option');
            option.value = exam.id;
            option.textContent = `${exam.name} (${exam.className} - ${exam.subject})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading exams:', error);
        Utils.showToast('Error loading exams list', 'error');
    }
}

async function loadExamResults() {
    const select = document.getElementById('examSelect');
    const examId = select.value;
    currentExamId = examId;

    const resultsArea = document.getElementById('resultsArea');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');
    const tableBody = document.getElementById('resultsTableBody');

    if (!examId) {
        resultsArea.style.display = 'none';
        noData.style.display = 'block';
        noData.textContent = 'Please select an exam to view results.';
        return;
    }

    resultsArea.style.display = 'none';
    noData.style.display = 'none';
    loading.style.display = 'block';
    tableBody.innerHTML = '';

    try {
        // 1. Get Exam Details
        const examsRes = await API.get('exams');
        const exam = examsRes.data.find(e => e.id == examId);

        if (!exam) throw new Error('Exam not found');

        document.getElementById('tableTitle').textContent = `Marks for ${exam.name} (${exam.className})`;

        // 2. Get Students
        const studentsRes = await API.get('students');
        const students = studentsRes.data.filter(s => s.class === exam.className);

        // 3. Get Existing Results
        const resultsRes = await API.get('results');
        const existingResults = resultsRes.data.filter(r => r.examId == examId);

        loading.style.display = 'none';
        resultsArea.style.display = 'block';

        if (students.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 1rem;">No students found in this class.</td></tr>';
            return;
        }

        // 4. Render Table
        students.sort((a, b) => a.roll.localeCompare(b.roll));

        students.forEach(student => {
            const result = existingResults.find(r => r.studentId == student.id);
            const marks = result ? result.marks : '';
            const grade = result ? result.grade : '-';
            const remarks = result ? result.remarks : '';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.roll}</td>
                <td>${student.name}</td>
                <td>
                    <input type="number" min="0" max="100" class="form-control marks-input" 
                        data-student-id="${student.id}" 
                        value="${marks}" 
                        oninput="calculateGrade(this); updateStats();"
                        style="width: 100px;">
                </td>
                <td class="grade-cell" style="font-weight: 600;">${grade}</td>
                <td>
                    <input type="text" class="form-control remarks-input" 
                        value="${remarks}" 
                        placeholder="Optional..."
                        style="font-size: 0.875rem;">
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Initial stats
        updateStats();

    } catch (error) {
        console.error('Error loading results:', error);
        loading.style.display = 'none';
        Utils.showToast('Error loading data', 'error');
    }
}

function calculateGrade(input) {
    const marks = parseFloat(input.value);
    const row = input.closest('tr');
    const gradeCell = row.querySelector('.grade-cell');

    if (isNaN(marks) || input.value === '') {
        gradeCell.textContent = '-';
        gradeCell.style.color = 'var(--text-main)';
        return;
    }

    let grade = 'F';
    let color = 'var(--danger-color)';

    if (marks >= 90) { grade = 'A+'; color = 'var(--secondary-color)'; }
    else if (marks >= 80) { grade = 'A'; color = 'var(--secondary-color)'; }
    else if (marks >= 70) { grade = 'B'; color = 'var(--info-color)'; }
    else if (marks >= 60) { grade = 'C'; color = 'var(--warning-color)'; }
    else if (marks >= 50) { grade = 'D'; color = 'var(--warning-color)'; }

    gradeCell.textContent = grade;
    gradeCell.style.color = color;

    if (marks < 0 || marks > 100) {
        input.style.borderColor = 'var(--danger-color)';
    } else {
        input.style.borderColor = 'var(--border-color)';
    }
}

function updateStats() {
    const inputs = document.querySelectorAll('.marks-input');
    let total = 0;
    let count = 0;
    let max = 0;
    let passCount = 0;

    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val >= 0 && val <= 100) {
            total += val;
            count++;
            if (val > max) max = val;
            if (val >= 50) passCount++;
        }
    });

    if (count > 0) {
        document.getElementById('statAverage').textContent = (total / count).toFixed(1);
        document.getElementById('statHigh').textContent = max;
        document.getElementById('statPass').textContent = Math.round((passCount / count) * 100) + '%';
    } else {
        document.getElementById('statAverage').textContent = '-';
        document.getElementById('statHigh').textContent = '-';
        document.getElementById('statPass').textContent = '-';
    }
}

async function saveResults() {
    if (!currentExamId) return;

    const inputs = document.querySelectorAll('.marks-input');
    const newResults = [];
    let hasError = false;

    inputs.forEach(input => {
        const marks = parseFloat(input.value);
        if (!isNaN(marks)) {
            if (marks < 0 || marks > 100) {
                hasError = true;
                input.style.borderColor = 'var(--danger-color)';
                return;
            }

            const row = input.closest('tr');
            const grade = row.querySelector('.grade-cell').textContent;
            const remarks = row.querySelector('.remarks-input').value;

            newResults.push({
                id: Date.now() + Math.random(),
                examId: currentExamId,
                studentId: parseInt(input.dataset.studentId),
                marks: marks,
                grade: grade,
                remarks: remarks,
                date: new Date().toISOString()
            });
        }
    });

    if (hasError) {
        Utils.showToast('Please correct invalid marks (0-100)', 'error');
        return;
    }

    try {
        const response = await API.get('results');
        let allResults = response.data;
        allResults = allResults.filter(r => r.examId != currentExamId);
        allResults = [...allResults, ...newResults];

        localStorage.setItem('sms_results', JSON.stringify(allResults));

        Utils.showToast('Results saved successfully', 'success');

    } catch (error) {
        console.error('Error saving results:', error);
        Utils.showToast('Error saving results', 'error');
    }
}

function exportResults() {
    if (!currentExamId) {
        Utils.showToast('Select an exam first', 'error');
        return;
    }

    const rows = document.querySelectorAll('#resultsTableBody tr');
    if (rows.length === 0) {
        Utils.showToast('No data to export', 'warning');
        return;
    }

    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Roll No,Student Name,Marks,Grade,Remarks\n";

    // Iterate over rows
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length < 5) return; // Skip empty/message rows

        const roll = cols[0].textContent.trim();
        const name = cols[1].textContent.trim();

        // Get values from inputs
        const marksInput = row.querySelector('.marks-input');
        const marks = marksInput ? marksInput.value : '';

        const grade = cols[3].textContent.trim();

        const remarksInput = row.querySelector('.remarks-input');
        const remarks = remarksInput ? remarksInput.value : '';

        // Escape commas in text
        const cleanName = name.replace(/,/g, " ");
        const cleanRemarks = remarks.replace(/,/g, " ");

        csvContent += `${roll},${cleanName},${marks},${grade},${cleanRemarks}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    // Filename: Results_ExamName_Date.csv
    const examTitle = document.getElementById('tableTitle').textContent.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Results_${examTitle}_${date}.csv`);

    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);

    Utils.showToast('Export successful!', 'success');
}
