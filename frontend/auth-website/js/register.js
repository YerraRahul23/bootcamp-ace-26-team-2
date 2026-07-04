/* ============================================
   REGISTRATION PAGE — Form Handling & Validation
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initRegisterForm();
    initPasswordStrength();
    initPasswordToggle();
    initSocialButtons();
});

/* ── Registration Form ── */
function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const nameInput = document.getElementById('regName');
    const emailInput = document.getElementById('regEmail');
    const usernameInput = document.getElementById('regUsername');
    const passwordInput = document.getElementById('regPassword');
    const confirmInput = document.getElementById('regConfirm');
    const termsCheckbox = document.getElementById('regTerms');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Real-time validation on blur
    nameInput.addEventListener('blur', () => {
        validateField(nameInput, [
            { type: 'required', message: 'Full name is required' },
            { type: 'minLength', min: 2, message: 'Name must be at least 2 characters' }
        ]);
    });

    nameInput.addEventListener('input', () => {
        if (nameInput.classList.contains('error') || nameInput.classList.contains('success')) {
            validateField(nameInput, [
                { type: 'required', message: 'Full name is required' },
                { type: 'minLength', min: 2, message: 'Name must be at least 2 characters' }
            ]);
        }
    });

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

    usernameInput.addEventListener('blur', () => {
        validateField(usernameInput, [
            { type: 'required', message: 'Username is required' },
            { type: 'username', message: '3-20 characters, letters, numbers, underscores' }
        ]);
    });

    usernameInput.addEventListener('input', () => {
        if (usernameInput.classList.contains('error') || usernameInput.classList.contains('success')) {
            validateField(usernameInput, [
                { type: 'required', message: 'Username is required' },
                { type: 'username', message: '3-20 characters, letters, numbers, underscores' }
            ]);
        }
    });

    passwordInput.addEventListener('blur', () => {
        validateField(passwordInput, [
            { type: 'required', message: 'Password is required' },
            { type: 'password', message: 'Password must be at least 8 characters' }
        ]);
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.classList.contains('error') || passwordInput.classList.contains('success')) {
            validateField(passwordInput, [
                { type: 'required', message: 'Password is required' },
                { type: 'password', message: 'Password must be at least 8 characters' }
            ]);
        }

        // Re-validate confirm password if it has value
        if (confirmInput.value) {
            validateField(confirmInput, [
                { type: 'required', message: 'Please confirm your password' },
                { type: 'match', matchValue: passwordInput.value, message: 'Passwords do not match' }
            ]);
        }
    });

    confirmInput.addEventListener('blur', () => {
        validateField(confirmInput, [
            { type: 'required', message: 'Please confirm your password' },
            { type: 'match', matchValue: passwordInput.value, message: 'Passwords do not match' }
        ]);
    });

    confirmInput.addEventListener('input', () => {
        if (confirmInput.classList.contains('error') || confirmInput.classList.contains('success')) {
            validateField(confirmInput, [
                { type: 'required', message: 'Please confirm your password' },
                { type: 'match', matchValue: passwordInput.value, message: 'Passwords do not match' }
            ]);
        }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields
        const isNameValid = validateField(nameInput, [
            { type: 'required', message: 'Full name is required' },
            { type: 'minLength', min: 2, message: 'Name must be at least 2 characters' }
        ]);

        const isEmailValid = validateField(emailInput, [
            { type: 'required', message: 'Email is required' },
            { type: 'email', message: 'Please enter a valid email address' }
        ]);

        const isUsernameValid = validateField(usernameInput, [
            { type: 'required', message: 'Username is required' },
            { type: 'username', message: '3-20 characters, letters, numbers, underscores' }
        ]);

        const isPasswordValid = validateField(passwordInput, [
            { type: 'required', message: 'Password is required' },
            { type: 'password', message: 'Password must be at least 8 characters' }
        ]);

        const isConfirmValid = validateField(confirmInput, [
            { type: 'required', message: 'Please confirm your password' },
            { type: 'match', matchValue: passwordInput.value, message: 'Passwords do not match' }
        ]);

        if (!isNameValid || !isEmailValid || !isUsernameValid || !isPasswordValid || !isConfirmValid) {
            showToast('error', 'Validation Error', 'Please check your inputs and try again.');
            return;
        }

        if (!termsCheckbox.checked) {
            showToast('error', 'Terms Required', 'Please accept the Terms of Service to continue.');
            return;
        }

        // Simulate API call
        setButtonLoading(submitBtn, true);

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            showToast('success', 'Account Created!', 'Welcome aboard! Redirecting to your dashboard...');

            // Simulate redirect
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);

        } catch (error) {
            showToast('error', 'Registration Failed', 'Could not create your account. Please try again.');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
}

/* ── Password Strength Meter ── */
function initPasswordStrength() {
    const passwordInput = document.getElementById('regPassword');
    if (!passwordInput) return;

    const strengthContainer = passwordInput.closest('.input-group').querySelector('.password-strength');
    if (!strengthContainer) return;

    const bars = strengthContainer.querySelectorAll('.strength-bar span');
    const text = strengthContainer.querySelector('.strength-text');

    passwordInput.addEventListener('input', () => {
        const value = passwordInput.value;
        const strength = calculatePasswordStrength(value);

        // Update bars
        bars.forEach((bar, index) => {
            bar.className = '';
            if (index < strength.level) {
                bar.classList.add('active', strength.className);
            }
        });

        // Update text
        text.textContent = strength.label;
        text.style.color = `var(--${strength.color})`;
    });
}

function calculatePasswordStrength(password) {
    let score = 0;

    if (password.length === 0) {
        return { level: 0, label: '', className: '', color: 'text-muted' };
    }

    // Length checks
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) {
        return { level: 1, label: 'Weak', className: 'weak', color: 'error' };
    } else if (score <= 3) {
        return { level: 2, label: 'Fair', className: 'medium', color: 'warning' };
    } else if (score <= 4) {
        return { level: 3, label: 'Good', className: 'medium', color: 'warning' };
    } else {
        return { level: 4, label: 'Strong', className: 'strong', color: 'success' };
    }
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

/* ── Social Register Buttons ── */
function initSocialButtons() {
    document.querySelectorAll('.btn-social').forEach(button => {
        button.addEventListener('click', async () => {
            const provider = button.classList.contains('btn-google') ? 'Google' : 'GitHub';

            setButtonLoading(button, true);

            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                showToast('info', `Continue with ${provider}`, `Redirecting to ${provider} authentication...`);
            } catch (error) {
                showToast('error', 'Authentication Failed', `Could not sign up with ${provider}.`);
            } finally {
                setButtonLoading(button, false);
            }
        });
    });
}