const API_URL = '/api/v1';

if (localStorage.getItem('token')) {
    window.location.replace('../index.html');
}

function showSnackbar(message, type = 'info') {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = `show ${type}`;
    setTimeout(() => { snackbar.className = snackbar.className.replace('show', ''); }, 3000);
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userName', data.name);
            showSnackbar('Registration successful! Redirecting...', 'success');
            setTimeout(() => window.location.replace('../index.html'), 1000);
        } else {
            showSnackbar(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showSnackbar('Network error. Please try again.', 'error');
    }
}
