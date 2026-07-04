/* ============================================
   LANDING PAGE — Scroll Reveal, FAQ, Testimonials
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initFAQ();
    initTestimonialCarousel();
    initCounterAnimation();
});

/* ── Scroll Reveal with Intersection Observer ── */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

/* ── FAQ Accordion ── */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    if (faqItems.length === 0) return;

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(other => {
                other.classList.remove('active');
                other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });

            // Toggle current
            if (!isActive) {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });

        // Keyboard support
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                question.click();
            }
        });
    });
}

/* ── Testimonial Carousel (Auto-scroll) ── */
function initTestimonialCarousel() {
    const grid = document.querySelector('.testimonials-grid');
    if (!grid) return;

    // On mobile, enable horizontal scroll with snap
    if (window.innerWidth < 768) {
        grid.style.display = 'flex';
        grid.style.overflowX = 'auto';
        grid.style.scrollSnapType = 'x mandatory';
        grid.style.gap = 'var(--space-4)';
        grid.style.paddingBottom = 'var(--space-4)';

        grid.querySelectorAll('.testimonial-card').forEach(card => {
            card.style.minWidth = '280px';
            card.style.scrollSnapAlign = 'start';
            card.style.flexShrink = '0';
        });
    }
}

/* ── Counter Animation ── */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter-value');

    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetValue = parseInt(target.getAttribute('data-target'));
                const duration = parseInt(target.getAttribute('data-duration')) || 2000;
                const startTime = performance.now();

                function updateCounter(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Ease out cubic
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const currentValue = Math.floor(eased * targetValue);

                    target.textContent = currentValue.toLocaleString();

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        target.textContent = targetValue.toLocaleString();
                    }
                }

                requestAnimationFrame(updateCounter);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}