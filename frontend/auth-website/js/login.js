/* ============================================
   LOGIN PAGE — Form Handling & Validation
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
    initPasswordToggle();
    initSocialButtons();
});

/* ── Login Form ── */
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Real-time validation
    emailInput.addEventListener('blur', () => {
        validateField(emailInput, [
            { type: 'required', message: 'Email is required' },
            { type: 'email', message: 'Please enter a valid email address' }
        ]);
    });

    emailInput.addEventListener('input', () => {
        if (emailInput.classList.contains('error') || emailInput.classList.contains('success')) {
            validateField(emailInput, [
                { type: 'required', message: 'Email is required' },
                { type: 'email', message: 'Please enter a valid email address' }
            ]);
        }
    });

    passwordInput.addEventListener('blur', () => {
        validateField(passwordInput, [
            { type: 'required', message: 'Password is required' }
        ]);
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.classList.contains('error') || passwordInput.classList.contains('success')) {
            validateField(passwordInput, [
                { type: 'required', message: 'Password is required' }
            ]);
        }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields
        const isEmailValid = validateField(emailInput, [
            { type: 'required', message: 'Email is required' },
            { type: 'email', message: 'Please enter a valid email address' }
        ]);

        const isPasswordValid = validateField(passwordInput, [
            { type: 'required', message: 'Password is required' }
        ]);

        if (!isEmailValid || !isPasswordValid) {
            showToast('error', 'Validation Error', 'Please check your inputs and try again.');
            return;
        }

        // Simulate API call
        setButtonLoading(submitBtn, true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const rememberMe = document.getElementById('rememberMe')?.checked;

            showToast('success', 'Welcome back!', 'You have been logged in successfully.');

            // Simulate redirect
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);

        } catch (error) {
            showToast('error', 'Login Failed', 'Invalid email or password. Please try again.');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
}

/* ── Password Visibility Toggle ── */
function initPasswordToggle() {
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            if (!input) return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';

            // Update icon
            const icon = button.querySelector('svg');
            if (isPassword) {
                icon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                icon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }

            button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
    });
}

/* ── Social Login Buttons ── */
function initSocialButtons() {
    document.querySelectorAll('.btn-social').forEach(button => {
        button.addEventListener('click', async () => {
            const provider = button.classList.contains('btn-google') ? 'Google' : 'GitHub';

            setButtonLoading(button, true);

            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                showToast('info', `Continue with ${provider}`, `Redirecting to ${provider} authentication...`);
            } catch (error) {
                showToast('error', 'Authentication Failed', `Could not sign in with ${provider}.`);
            } finally {
                setButtonLoading(button, false);
            }
        });
    });
}