const API_URL = 'http://localhost:8080/api/v1';
let keywords = [];

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('auth/login.html');
        return false;
    }
    document.body.className = 'auth-verified';
    const userName = localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail') || '';
    document.getElementById('userInfo').innerHTML = `<i class="fas fa-user"></i> ${userName}`;
    return true;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.replace('auth/login.html');
}

function showSnackbar(message, type = 'success') {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = `show ${type}`;
    setTimeout(() => { snackbar.className = snackbar.className.replace('show', ''); }, 3000);
}
function showConfirm(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-content">
            <p>${message}</p>
            <div class="confirm-buttons">
                <button class="btn-cancel" id="confirmCancel">Cancel</button>
                <button class="btn-confirm" id="confirmOk">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('confirmOk').onclick = () => {
        document.body.removeChild(modal);
        onConfirm();
    };
    document.getElementById('confirmCancel').onclick = () => {
        document.body.removeChild(modal);
    };
}
window.onload = async function () {
    if (!checkAuth()) return;
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
        if (!localStorage.getItem('token')) {
            window.location.replace('auth/login.html');
        } else {
            window.history.pushState(null, '', window.location.href);
        }
    };
    await loadKeywords();
};
async function loadKeywords() {
    try {
        const response = await fetch(`${API_URL}/keywords?isActive=true`, {
            headers: getAuthHeaders()
        });
        if (response.status === 401) {
            logout();
            return;
        }
        const data = await response.json();
        keywords = data.items || [];
        displayKeywords();
    }
    catch (error) {
        console.error('Error loading keywords:', error);
    }
}
async function addKeyword() {
    const input = document.getElementById('keywordInput');
    const keyword = input.value.trim();
    if (!keyword) {
        showSnackbar('Please enter a keyword', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/keywords`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name: keyword })
        });
        if (response.status === 401) {
            logout();
            return;
        }
        if (!response.ok)
            throw new Error('Failed to add keyword');
        input.value = '';
        showSnackbar('✓ Keyword added successfully', 'success');
        await loadKeywords();
    }
    catch (error) {
        showSnackbar(`${error.message}`, 'error');
    }
}
function displayKeywords() {
    const keywordsList = document.getElementById('keywordsList');
    if (keywords.length === 0) {
        keywordsList.innerHTML = '<span style="color: #666; font-size: 14px;">No keywords added yet</span>';
        return;
    }
    keywordsList.innerHTML = keywords
        .map(k => `<span class="keyword-tag">${k.name} <span class="delete-btn" onclick="deleteKeyword('${k.id}')">×</span></span>`)
        .join('');
}
async function deleteKeyword(id) {
    showConfirm('Delete this keyword?', async () => {
        try {
            const response = await fetch(`${API_URL}/keywords/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.status === 401) {
                logout();
                return;
            }
            if (!response.ok)
                throw new Error('Failed to delete keyword');
            showSnackbar('✓ Keyword deleted', 'success');
            await loadKeywords();
        }
        catch (error) {
            showSnackbar(`${error.message}`, 'error');
        }
    });
}
async function scanCV() {
    const fileInput = document.getElementById('cvFile');
    const resultsDiv = document.getElementById('scanResults');
    const scanBtn = document.getElementById('scanBtn');
    if (!fileInput.files?.[0]) {
        showSnackbar('Please select a PDF file', 'error');
        return;
    }
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    scanBtn.disabled = true;
    showSnackbar('Scanning CV...', 'info');
    resultsDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Scanning CV, please wait...</p></div>';
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/scan`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (response.status === 401) {
            logout();
            return;
        }
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Scan failed');
        }
        showSnackbar('✓ CV scanned successfully!', 'success');
        displayResults(data, resultsDiv);
    }
    catch (error) {
        resultsDiv.innerHTML = '';
        showSnackbar(`${error.message}`, 'error');
    }
    finally {
        scanBtn.disabled = false;
    }
}
async function rescanCV() {
    const emailInput = document.getElementById('rescanEmail');
    const resultsDiv = document.getElementById('rescanResults');
    const email = emailInput.value.trim();
    if (!email) {
        showSnackbar('Please enter an email address', 'error');
        return;
    }
    showSnackbar('Rescanning CV...', 'info');
    resultsDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Rescanning CV, please wait...</p></div>';
    try {
        const response = await fetch(`${API_URL}/rescan`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email })
        });
        if (response.status === 401) {
            logout();
            return;
        }
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Rescan failed');
        }
        showSnackbar('✓ CV rescanned successfully!', 'success');
        displayResults(data, resultsDiv, true);
    }
    catch (error) {
        resultsDiv.innerHTML = '';
        showSnackbar(`${error.message}`, 'error');
    }
}
function displayResults(data, resultsDiv, isRescan = false) {
    const keywordTags = data.matchedKeywords.length > 0
        ? data.matchedKeywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')
        : '<span style="color: #666;">No keywords matched</span>';
    const title = isRescan ? 'Rescan Results' : 'Scan Results';
    const updatedInfo = data.updatedAt && data.scannedAt !== data.updatedAt
        ? `<div class="result-item">
            <strong>Last Updated:</strong> ${new Date(data.updatedAt).toLocaleString()}
        </div>`
        : '';
    resultsDiv.innerHTML = `
        <h2>${title}</h2>
        <div class="result-item">
            <strong>Name:</strong> ${data.extractedName || 'Unknown'}
        </div>
        <div class="result-item">
            <strong>Email:</strong> ${data.email}
        </div>
        <div class="result-item">
            <strong>Matched Keywords (${data.matchedKeywords.length}):</strong>
            <div class="keywords">${keywordTags}</div>
        </div>
        <div class="result-item">
            <strong>Scanned At:</strong> ${new Date(data.scannedAt).toLocaleString()}
        </div>
        ${updatedInfo}
    `;
}
function openModal() {
    document.getElementById('cvModal').style.display = 'block';
    viewAllCVs();
}
function closeModal() {
    document.getElementById('cvModal').style.display = 'none';
}
window.onclick = function (event) {
    const modal = document.getElementById('cvModal');
    if (event.target === modal) {
        closeModal();
    }
};
async function viewAllCVs() {
    const cvListDiv = document.getElementById('cvList');
    cvListDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading scanned CVs...</p></div>';
    try {
        const response = await fetch(`${API_URL}/scanned-cvs`, {
            headers: getAuthHeaders()
        });
        if (response.status === 401) {
            logout();
            return;
        }
        const data = await response.json();
        if (!response.ok) {
            throw new Error('Failed to load CVs');
        }
        if (data.items.length === 0) {
            cvListDiv.innerHTML = '<div class="info">No scanned CVs found</div>';
            return;
        }
        cvListDiv.innerHTML = `
            <div style="margin-bottom: 15px; color: #666;">${data.items.length} CV(s) found</div>
            ${data.items.map(cv => `
                <div class="cv-list-item">
                    <h3>${cv.extractedName || 'Unknown'}</h3>
                    <div><strong>Email:</strong> ${cv.email}</div>
                    <div><strong>Keywords Matched:</strong> ${cv.matchedKeywords.length}</div>
                    <div class="keywords">
                        ${cv.matchedKeywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
                    </div>
                    <div><strong>Scanned:</strong> ${new Date(cv.scannedAt).toLocaleString()}</div>
                    <div class="cv-actions">
                        <button class="btn-warning btn-small" onclick="rescanFromList('${cv.email}')">Rescan</button>
                        <button class="btn-info btn-small" onclick="previewCV('${cv.email}')">Preview</button>
                        <button class="btn-danger btn-small" onclick="deleteCv('${cv.email}')">Delete</button>
                    </div>
                </div>
            `).join('')}
        `;
    }
    catch (error) {
        cvListDiv.innerHTML = `<div class="error">${error.message}</div>`;
    }
}
async function deleteCv(email) {
    showConfirm(`Delete CV for ${email}?`, async () => {
        const cvListDiv = document.getElementById('cvList');
        cvListDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Deleting CV...</p></div>';
        try {
            const response = await fetch(`${API_URL}/scanned-cvs/${email}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.status === 401) {
                logout();
                return;
            }
            if (!response.ok)
                throw new Error('Failed to delete CV');
            showSnackbar('✓ CV deleted', 'success');
            await viewAllCVs();
        }
        catch (error) {
            cvListDiv.innerHTML = `<div class="error">${error.message}</div>`;
        }
    });
}
function rescanFromList(email) {
    closeModal();
    const rescanInput = document.getElementById('rescanEmail');
    rescanInput.value = email;
    rescanInput.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => rescanCV(), 300);
}
async function batchScanCV() {
    const fileInput = document.getElementById('zipFile');
    const resultsDiv = document.getElementById('batchResults');
    const batchBtn = document.getElementById('batchScanBtn');
    if (!fileInput.files?.[0]) {
        showSnackbar('Please select a ZIP file', 'error');
        return;
    }
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    batchBtn.disabled = true;
    showSnackbar('Processing batch scan...', 'info');
    resultsDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Processing batch scan, please wait...</p></div>';
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/batch/scan`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (response.status === 401) {
            logout();
            return;
        }
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Batch scan failed');
        }
        showSnackbar(`✓ Batch scan completed! ${data.processed} processed, ${data.failed} failed`, 'success');
        displayBatchResults(data, resultsDiv);
    }
    catch (error) {
        resultsDiv.innerHTML = '';
        showSnackbar(`${error.message}`, 'error');
    }
    finally {
        batchBtn.disabled = false;
    }
}
function displayBatchResults(data, resultsDiv) {
    resultsDiv.innerHTML = `
        <h2>Batch Scan Results</h2>
        <div class="result-item">
            <strong>Total Processed:</strong> ${data.processed}
        </div>
        <div class="result-item">
            <strong>Failed:</strong> ${data.failed}
        </div>
        ${data.results.length > 0 ? `
            <div class="result-item">
                <strong>Successfully Scanned:</strong>
                ${data.results.map(r => `
                    <div class="cv-list-item">
                        <div><strong>File:</strong> ${r.file}</div>
                        <div><strong>Name:</strong> ${r.extractedName}</div>
                        <div><strong>Email:</strong> ${r.email}</div>
                        <div><strong>Keywords Matched:</strong> ${r.matchedKeywords.length}</div>
                        <div class="keywords">
                            ${r.matchedKeywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        ${data.errors.length > 0 ? `
            <div class="result-item">
                <strong>Errors:</strong>
                ${data.errors.map(e => `
                    <div style="color: #d32f2f; margin: 5px 0;">
                        <strong>${e.file}:</strong> ${e.error}
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}
async function previewCV(email) {
    try {
        const response = await fetch(`${API_URL}/scanned-cvs`, {
            headers: getAuthHeaders()
        });
        if (response.status === 401) {
            logout();
            return;
        }
        const data = await response.json();
        if (!response.ok)
            throw new Error('Failed to load CV');
        const cv = data.items.find(item => item.email === email);
        if (!cv)
            throw new Error('CV not found');
        const previewModal = document.createElement('div');
        previewModal.className = 'modal';
        previewModal.style.display = 'block';
        previewModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📄 CV Preview - ${cv.extractedName || 'Unknown'}</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="result-item">
                        <strong>Email:</strong> ${cv.email}
                    </div>
                    <div class="result-item">
                        <strong>Extracted Text:</strong>
                        <pre style="white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 4px; max-height: 400px; overflow-y: auto; font-size: 13px; line-height: 1.5;">${cv.fullText || 'No text available'}</pre>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(previewModal);
        previewModal.onclick = (e) => {
            if (e.target === previewModal)
                previewModal.remove();
        };
    }
    catch (error) {
        showSnackbar(`${error.message}`, 'error');
    }
}
// Expose functions to global scope for HTML onclick handlers
window.addKeyword = addKeyword;
window.scanCV = scanCV;
window.rescanCV = rescanCV;
window.deleteKeyword = deleteKeyword;
window.openModal = openModal;
window.closeModal = closeModal;
window.deleteCv = deleteCv;
window.rescanFromList = rescanFromList;
window.batchScanCV = batchScanCV;
window.previewCV = previewCV;
window.logout = logout;
export {};
