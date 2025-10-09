import type { Keyword, ScannedCV, ApiResponse, BatchScanResponse } from '../src/utils/interface.js';

const API_URL = 'http://localhost:8080/api/v1';
let keywords: Keyword[] = [];

function showSnackbar(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const snackbar = document.getElementById('snackbar')!;
    snackbar.textContent = message;
    snackbar.className = `show ${type}`;
    setTimeout(() => { snackbar.className = snackbar.className.replace('show', ''); }, 3000);
}

function showConfirm(message: string, onConfirm: () => void): void {
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
    
    document.getElementById('confirmOk')!.onclick = () => {
        document.body.removeChild(modal);
        onConfirm();
    };
    
    document.getElementById('confirmCancel')!.onclick = () => {
        document.body.removeChild(modal);
    };
}

window.onload = async function(): Promise<void> {
    await loadKeywords();
};

async function loadKeywords(): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/keywords?isActive=true`);
        const data: ApiResponse<Keyword> = await response.json();
        keywords = data.items || [];
        displayKeywords();
    } catch (error) {
        console.error('Error loading keywords:', error);
    }
}

async function addKeyword(): Promise<void> {
    const input = document.getElementById('keywordInput') as HTMLInputElement;
    const keyword = input.value.trim();

    if (!keyword) {
        showSnackbar('Please enter a keyword', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/keywords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: keyword })
        });

        if (!response.ok) throw new Error('Failed to add keyword');

        input.value = '';
        showSnackbar('✓ Keyword added successfully', 'success');
        await loadKeywords();
    } catch (error) {
        showSnackbar(`Error: ${(error as Error).message}`, 'error');
    }
}

function displayKeywords(): void {
    const keywordsList = document.getElementById('keywordsList')!;
    
    if (keywords.length === 0) {
        keywordsList.innerHTML = '<span style="color: #666; font-size: 14px;">No keywords added yet</span>';
        return;
    }

    keywordsList.innerHTML = keywords
        .map(k => `<span class="keyword-tag">${k.name} <span class="delete-btn" onclick="deleteKeyword('${k.id}')">×</span></span>`)
        .join('');
}

async function deleteKeyword(id: string): Promise<void> {
    showConfirm('Delete this keyword?', async () => {
        try {
            const response = await fetch(`${API_URL}/keywords/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete keyword');

            showSnackbar('✓ Keyword deleted', 'success');
            await loadKeywords();
        } catch (error) {
            showSnackbar(`Error: ${(error as Error).message}`, 'error');
        }
    });
}

async function scanCV(): Promise<void> {
    const fileInput = document.getElementById('cvFile') as HTMLInputElement;
    const resultsDiv = document.getElementById('scanResults')!;
    const scanBtn = document.getElementById('scanBtn') as HTMLButtonElement;

    if (!fileInput.files?.[0]) {
        showSnackbar('Please select a PDF file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    scanBtn.disabled = true;
    showSnackbar('Scanning CV...', 'info');
    resultsDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/scan`, {
            method: 'POST',
            body: formData
        });

        const data: ScannedCV = await response.json();

        if (!response.ok) {
            throw new Error((data as any).message || 'Scan failed');
        }

        showSnackbar('✓ CV scanned successfully!', 'success');
        displayResults(data, resultsDiv);
    } catch (error) {
        showSnackbar(`Error: ${(error as Error).message}`, 'error');
    } finally {
        scanBtn.disabled = false;
    }
}

async function rescanCV(): Promise<void> {
    const emailInput = document.getElementById('rescanEmail') as HTMLInputElement;
    const resultsDiv = document.getElementById('rescanResults')!;
    const email = emailInput.value.trim();

    if (!email) {
        showSnackbar('Please enter an email address', 'error');
        return;
    }

    showSnackbar('Rescanning CV...', 'info');
    resultsDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/rescan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data: ScannedCV = await response.json();

        if (!response.ok) {
            throw new Error((data as any).message || 'Rescan failed');
        }

        showSnackbar('✓ CV rescanned successfully!', 'success');
        displayResults(data, resultsDiv, true);
    } catch (error) {
        showSnackbar(`Error: ${(error as Error).message}`, 'error');
    }
}

function displayResults(data: ScannedCV, resultsDiv: HTMLElement, isRescan: boolean = false): void {
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

function openModal(): void {
    document.getElementById('cvModal')!.style.display = 'block';
    viewAllCVs();
}

function closeModal(): void {
    document.getElementById('cvModal')!.style.display = 'none';
}

window.onclick = function(event: MouseEvent): void {
    const modal = document.getElementById('cvModal')!;
    if (event.target === modal) {
        closeModal();
    }
}

async function viewAllCVs(): Promise<void> {
    const cvListDiv = document.getElementById('cvList')!;
    
    cvListDiv.innerHTML = '<div class="loading">Loading scanned CVs...</div>';

    try {
        const response = await fetch(`${API_URL}/scanned-cvs`);
        const data: ApiResponse<ScannedCV> = await response.json();

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
    } catch (error) {
        cvListDiv.innerHTML = `<div class="error">Error: ${(error as Error).message}</div>`;
    }
}

async function deleteCv(email: string): Promise<void> {
    showConfirm(`Delete CV for ${email}?`, async () => {
        const cvListDiv = document.getElementById('cvList')!;
        cvListDiv.innerHTML = '<div class="loading">Deleting CV...</div>';

        try {
            const response = await fetch(`${API_URL}/scanned-cvs/${email}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete CV');

            showSnackbar('✓ CV deleted', 'success');
            await viewAllCVs();
        } catch (error) {
            cvListDiv.innerHTML = `<div class="error">Error: ${(error as Error).message}</div>`;
        }
    });
}

function rescanFromList(email: string): void {
    closeModal();
    const rescanInput = document.getElementById('rescanEmail') as HTMLInputElement;
    rescanInput.value = email;
    rescanInput.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => rescanCV(), 300);
}

async function batchScanCV(): Promise<void> {
    const fileInput = document.getElementById('zipFile') as HTMLInputElement;
    const resultsDiv = document.getElementById('batchResults')!;
    const batchBtn = document.getElementById('batchScanBtn') as HTMLButtonElement;

    if (!fileInput.files?.[0]) {
        showSnackbar('Please select a ZIP file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    batchBtn.disabled = true;
    showSnackbar('Processing batch scan...', 'info');
    resultsDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/batch/scan`, {
            method: 'POST',
            body: formData
        });

        const data: BatchScanResponse = await response.json();

        if (!response.ok) {
            throw new Error((data as any).message || 'Batch scan failed');
        }

        showSnackbar(`✓ Batch scan completed! ${data.processed} processed, ${data.failed} failed`, 'success');
        displayBatchResults(data, resultsDiv);
    } catch (error) {
        showSnackbar(`Error: ${(error as Error).message}`, 'error');
    } finally {
        batchBtn.disabled = false;
    }
}

function displayBatchResults(data: BatchScanResponse, resultsDiv: HTMLElement): void {
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

async function previewCV(email: string): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/scanned-cvs`);
        const data: ApiResponse<ScannedCV> = await response.json();
        
        if (!response.ok) throw new Error('Failed to load CV');
        
        const cv = data.items.find(item => item.email === email);
        if (!cv) throw new Error('CV not found');
        
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
            if (e.target === previewModal) previewModal.remove();
        };
    } catch (error) {
        showSnackbar(`Error: ${(error as Error).message}`, 'error');
    }
}

// Expose functions to global scope for HTML onclick handlers
(window as any).addKeyword = addKeyword;
(window as any).scanCV = scanCV;
(window as any).rescanCV = rescanCV;
(window as any).deleteKeyword = deleteKeyword;
(window as any).openModal = openModal;
(window as any).closeModal = closeModal;
(window as any).deleteCv = deleteCv;
(window as any).rescanFromList = rescanFromList;
(window as any).batchScanCV = batchScanCV;
(window as any).previewCV = previewCV;
