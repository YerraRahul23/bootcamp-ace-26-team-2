/* ============================================
   MAIN — Global Functionality
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initMobileMenu();
    initScrollEffects();
    initCursorGlow();
    initButtonRipple();
    initSmoothScroll();
});

/* ── Theme Toggle ── */
function initThemeToggle() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    toggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Animate icon
        const icon = toggle.querySelector('svg');
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            icon.style.transform = '';
        }, 500);
    });
}

/* ── Mobile Menu ── */
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', isOpen);

        // Update icon
        const icon = menuBtn.querySelector('svg');
        if (isOpen) {
            icon.innerHTML = `
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            `;
        } else {
            icon.innerHTML = `
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            `;
        }
    });

    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            menuBtn.setAttribute('aria-expanded', 'false');
        });
    });
}

/* ── Scroll Effects ── */
function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    const scrollProgress = document.querySelector('.scroll-progress');

    if (!navbar) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollY / docHeight) * 100;

        // Navbar background
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Scroll progress bar
        if (scrollProgress) {
            scrollProgress.style.width = `${scrollPercent}%`;
        }
    });
}

/* ── Cursor Glow Effect ── */
function initCursorGlow() {
    const glow = document.querySelector('.cursor-glow');
    if (!glow) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isVisible = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isVisible) {
            isVisible = true;
            glow.classList.add('visible');
        }
    });

    document.addEventListener('mouseleave', () => {
        isVisible = false;
        glow.classList.remove('visible');
    });

    // Smooth follow with requestAnimationFrame
    function animateGlow() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        glow.style.left = `${currentX}px`;
        glow.style.top = `${currentY}px`;

        requestAnimationFrame(animateGlow);
    }

    animateGlow();
}

/* ── Button Ripple Effect ── */
function initButtonRipple() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        const ripple = document.createElement('span');
        ripple.classList.add('ripple');

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

        btn.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
}

/* ── Smooth Scroll for Anchor Links ── */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();

            const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'));
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/* ── Toast Notification System ── */
function showToast(type, title, message, duration = 4000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const icons = {
        success: '<circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path>',
        error: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
        info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="toast-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${icons[type]}
            </svg>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close notification">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    container.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        dismissToast(toast);
    });

    // Auto dismiss
    if (duration > 0) {
        setTimeout(() => {
            dismissToast(toast);
        }, duration);
    }
}

function dismissToast(toast) {
    toast.classList.remove('visible');
    setTimeout(() => {
        toast.remove();
    }, 400);
}

/* ── Loading State for Buttons ── */
function setButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
        button.classList.add('loading');
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.setAttribute('aria-hidden', 'true');
        button.appendChild(spinner);
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        const spinner = button.querySelector('.spinner');
        if (spinner) spinner.remove();
        button.disabled = false;
    }
}

/* ── Form Validation Utilities ── */
const validators = {
    email: (value) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(value);
    },
    password: (value) => {
        return value.length >= 8;
    },
    required: (value) => {
        return value.trim().length > 0;
    },
    minLength: (value, min) => {
        return value.length >= min;
    },
    match: (value, matchValue) => {
        return value === matchValue;
    },
    username: (value) => {
        const re = /^[a-zA-Z0-9_]{3,20}$/;
        return re.test(value);
    }
};

function validateField(input, rules) {
    const wrapper = input.closest('.input-wrapper');
    const errorEl = wrapper ? wrapper.parentElement.querySelector('.input-error') : null;
    const value = input.value;

    for (const rule of rules) {
        let isValid = true;
        let errorMessage = '';

        if (typeof rule === 'function') {
            isValid = rule(value);
            errorMessage = 'Invalid value';
        } else if (rule.type === 'required') {
            isValid = validators.required(value);
            errorMessage = rule.message || 'This field is required';
        } else if (rule.type === 'email') {
            isValid = validators.email(value);
            errorMessage = rule.message || 'Please enter a valid email';
        } else if (rule.type === 'password') {
            isValid = validators.password(value);
            errorMessage = rule.message || 'Password must be at least 8 characters';
        } else if (rule.type === 'minLength') {
            isValid = validators.minLength(value, rule.min);
            errorMessage = rule.message || `Minimum ${rule.min} characters required`;
        } else if (rule.type === 'match') {
            isValid = validators.match(value, rule.matchValue);
            errorMessage = rule.message || 'Values do not match';
        } else if (rule.type === 'username') {
            isValid = validators.username(value);
            errorMessage = rule.message || '3-20 characters, letters, numbers, underscores';
        }

        if (!isValid) {
            input.classList.add('error');
            input.classList.remove('success');
            if (errorEl) {
                errorEl.textContent = errorMessage;
                errorEl.classList.add('visible');
            }
            return false;
        }
    }

    input.classList.remove('error');
    input.classList.add('success');
    if (errorEl) {
        errorEl.classList.remove('visible');
    }
    return true;
}