class LoginApp {
    constructor() {
        this.captchaResult = null;
        this.expectedResult = null;
        this.init();
    }

    async init() {
        await this.loadCaptcha();
        this.bindEvents();
    }

    async loadCaptcha() {
        try {
            const response = await fetch('/api/auth/captcha');
            const captcha = await response.json();
            this.expectedResult = captcha.result;
            document.getElementById('captchaQuestion').textContent = captcha.question;
            document.getElementById('captchaInput').value = '';
        } catch (error) {
            console.error('Error loading captcha:', error);
            this.showError('Error al cargar el captcha');
        }
    }

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        const refreshCaptcha = document.getElementById('refreshCaptcha');
        if (refreshCaptcha) {
            refreshCaptcha.addEventListener('click', () => this.loadCaptcha());
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const captchaResult = parseInt(document.getElementById('captchaInput').value);

        if (!username || !password) {
            this.showError('Por favor complete todos los campos');
            return;
        }

        if (isNaN(captchaResult)) {
            this.showError('Por favor ingrese el resultado del captcha');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    captchaResult: captchaResult,
                    expectedResult: this.expectedResult
                })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                window.location.href = '/dashboard';
            } else {
                const error = await response.json();
                this.showError(error.error || 'Error al iniciar sesión');
                await this.loadCaptcha();
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión con el servidor');
            await this.loadCaptcha();
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

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new LoginApp();
});