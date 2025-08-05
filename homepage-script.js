// Parallax scrolling effects
document.addEventListener('DOMContentLoaded', function () {
    // Parallax scrolling for floating shapes
    window.addEventListener('scroll', function () {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.floating-shape');

        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
        });

        // Parallax header effect
        const header = document.querySelector('.parallax-header');
        if (header) {
            const headerSpeed = 0.3;
            const headerYPos = -(scrolled * headerSpeed);
            header.style.transform = `translateY(${headerYPos}px)`;
        }

        // Parallax footer effect
        const footer = document.querySelector('.parallax-footer');
        if (footer) {
            const footerSpeed = 0.2;
            const footerYPos = -(scrolled * footerSpeed);
            footer.style.transform = `translateY(${footerYPos}px)`;
        }
    });

    // Add scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe game cards for scroll animations
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add mouse movement parallax effect
    document.addEventListener('mousemove', function (e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        const shapes = document.querySelectorAll('.floating-shape');
        shapes.forEach((shape, index) => {
            const moveX = (mouseX - 0.5) * (20 + index * 5);
            const moveY = (mouseY - 0.5) * (20 + index * 5);

            shape.style.transform += ` translate(${moveX}px, ${moveY}px)`;
        });
    });

    // Add smooth scroll behavior for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading animation
    window.addEventListener('load', function () {
        document.body.classList.add('loaded');

        // Stagger animation for game cards
        const cards = document.querySelectorAll('.game-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 200 * (index + 1));
        });
    });

    // Add hover effects for floating shapes
    const shapes = document.querySelectorAll('.floating-shape');
    shapes.forEach(shape => {
        shape.addEventListener('mouseenter', function () {
            this.style.transform += ' scale(1.2)';
            this.style.transition = 'transform 0.3s ease';
        });

        shape.addEventListener('mouseleave', function () {
            this.style.transform = this.style.transform.replace(' scale(1.2)', '');
        });
    });

    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #48bb78, #38a169);
        z-index: 1000;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function () {
        const scrolled = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = scrolled + '%';
    });
});

// Add CSS for scroll progress bar
const style = document.createElement('style');
style.textContent = `
    .scroll-progress {
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    body.loaded .game-card {
        animation: none;
    }
    
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
    
    .play-button:hover::before {
        animation: shimmer 0.6s ease;
    }
`;
document.head.appendChild(style); 