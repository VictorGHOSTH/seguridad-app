class LoginApp {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const recaptchaToken = grecaptcha.getResponse();

        if (!username || !password) {
            this.showError('Por favor complete todos los campos');
            return;
        }

        if (!recaptchaToken) {
            document.getElementById('captchaError').style.display = 'block';
            return;
        }

        document.getElementById('captchaError').style.display = 'none';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, recaptchaToken })
            });

            if (response.ok) {
                const data = await response.json();
                // ✅ Guardar todo incluyendo permisos
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                localStorage.setItem('esAdministrador', data.esAdministrador);
                localStorage.setItem('permisos', JSON.stringify(data.permisos));
                window.location.href = '/dashboard';
            } else {
                const error = await response.json();
                this.showError(error.error || 'Error al iniciar sesión');
                grecaptcha.reset();
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión con el servidor');
            grecaptcha.reset();
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginApp();
});