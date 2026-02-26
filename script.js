/**
 * 祝生日快乐 - 主脚本
 */
(function() {
    'use strict';

    const CONFIG = {
        texts: ['hello，早上好', null, '生日快乐！'],
        targetDate: { year: 2026, month: 3, day: 1, week: 0 },
        weekdays: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        fireworkPalettes: [
            ['#7dd3fc', '#38bdf8', '#0ea5e9', '#fff'],
            ['#f9a8d4', '#f472b6', '#ec4899', '#fff'],
            ['#fbbf24', '#f59e0b', '#fcd34d', '#fff'],
            ['#a78bfa', '#c084fc', '#e879f9', '#fff'],
            ['#34d399', '#2dd4bf', '#5eead4', '#fff'],
            ['#fb923c', '#f97316', '#fdba74', '#fff']
        ]
    };

    const $ = id => document.getElementById(id);
    const canvas = $('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    const typeText = $('typeText');
    const surpriseBtn = $('surpriseBtn');
    const startScreen = $('startScreen');
    const giftBox = $('giftBox');
    const dateRollerWrap = $('dateRollerWrap');
    const rollerEls = {
        year: $('numYear'), month: $('numMonth'),
        day: $('numDay'), week: $('numWeek')
    };

    let bursts = [];
    let rafId = null;

    function resizeCanvas() {
        const w = window.innerWidth, h = window.innerHeight;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
    }

    function initCanvas() {
        resizeCanvas();
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resizeCanvas, 100);
        });
    }

    class PixelBurst {
        constructor(cx, cy, palette) {
            this.cx = cx;
            this.cy = cy;
            this.palette = palette;
            this.dots = [];
            this.alpha = 1;
            this.decay = 0.003;
            this.frame = 0;
            const n = 280 + Math.floor(Math.random() * 80);
            for (let i = 0; i < n; i++) {
                const a = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 3;
                this.dots.push({
                    x: 0, y: 0,
                    vx: Math.cos(a) * speed,
                    vy: Math.sin(a) * speed,
                    friction: 0.98 + Math.random() * 0.015,
                    size: 0.6 + Math.random() * 1.2,
                    color: palette[Math.floor(Math.random() * palette.length)]
                });
            }
        }
        update() {
            this.frame++;
            for (const d of this.dots) {
                d.x += d.vx;
                d.y += d.vy;
                d.vx *= d.friction;
                d.vy *= d.friction;
            }
            if (this.frame > 80) this.alpha -= this.decay;
            return this.alpha > 0;
        }
        draw() {
            ctx.save();
            for (const d of this.dots) {
                const x = this.cx + d.x;
                const y = this.cy + d.y;
                const dist = Math.sqrt(d.x * d.x + d.y * d.y);
                const edgeFade = Math.max(0, 1 - dist / 100);
                ctx.globalAlpha = this.alpha * edgeFade;
                ctx.fillStyle = d.color;
                ctx.beginPath();
                ctx.arc(x, y, d.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    function fireworkLoop() {
        if (!canvas.width || !canvas.height) {
            rafId = requestAnimationFrame(fireworkLoop);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        bursts = bursts.filter(b => { b.update(); b.draw(); return b.alpha > 0; });
        if (bursts.length) rafId = requestAnimationFrame(fireworkLoop);
    }

    function createFirework() {
        const w = canvas.width, h = canvas.height;
        const cx = w * 0.2 + Math.random() * w * 0.6;
        const cy = h * 0.25 + Math.random() * h * 0.5;
        const palette = CONFIG.fireworkPalettes[Math.floor(Math.random() * CONFIG.fireworkPalettes.length)];
        bursts.push(new PixelBurst(cx, cy, palette));
        if (!rafId) rafId = requestAnimationFrame(fireworkLoop);
    }

    function showFireworks() {
        createFirework();
        setTimeout(createFirework, 1200);
        setTimeout(createFirework, 2400);
        setTimeout(createFirework, 3600);
        setTimeout(createFirework, 4800);
    }

    function rollDateWheel() {
        dateRollerWrap.style.display = 'flex';
        dateRollerWrap.style.opacity = '0';
        dateRollerWrap.style.transform = 'translateY(10px)';
        dateRollerWrap.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        dateRollerWrap.offsetHeight;
        dateRollerWrap.style.opacity = '1';
        dateRollerWrap.style.transform = 'translateY(0)';

        const T = CONFIG.targetDate;
        const DURATION = 3600;

        [rollerEls.month, rollerEls.day, rollerEls.week].forEach(el => el.classList.add('rolling'));
        setTimeout(() => {
            rollerEls.month.textContent = String(T.month);
            rollerEls.day.textContent = String(T.day);
            rollerEls.week.textContent = CONFIG.weekdays[T.week];
            [rollerEls.month, rollerEls.day, rollerEls.week].forEach(el => el.classList.remove('rolling'));
        }, 700);

        setTimeout(() => {
            dateRollerWrap.style.opacity = '0';
            setTimeout(() => {
                dateRollerWrap.style.display = 'none';
                typeText.textContent = '';
                runTypeEffect();
            }, 500);
        }, DURATION);
    }

    let textIndex = 0, charIndex = 0, isDeleting = false;

    function runTypeEffect() {
        if (textIndex === 1 && CONFIG.texts[1] === null) {
            typeText.textContent = '';
            rollDateWheel();
            textIndex = 2;
            return;
        }
        const current = CONFIG.texts[textIndex];
        if (!current) return;
        const speed = isDeleting ? 70 : 110;

        if (isDeleting) charIndex--;
        else charIndex++;
        typeText.textContent = current.substring(0, charIndex);

        if (!isDeleting && charIndex === current.length) {
            if (textIndex === CONFIG.texts.length - 1) {
                showFireworks();
                setTimeout(() => surpriseBtn.classList.add('show'), 800);
                return;
            }
            setTimeout(() => { isDeleting = true; }, 1300);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex++;
        }
        setTimeout(runTypeEffect, speed);
    }

    function initGiftAnimation() {
        const page1 = $('page1');
        const foldCornerWrap = $('foldCornerWrap');
        let isDragging = false, radius = 100, centerX, centerY;

        function getBoxRect() {
            const r = giftBox.getBoundingClientRect();
            return { w: r.width, h: r.height, left: r.left, top: r.top };
        }
        let box = getBoxRect();
        centerX = 0;
        centerY = 0;

        window.addEventListener('resize', () => { box = getBoxRect(); });

        function dragHandler(e) {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            centerX = clientX - box.left;
            centerY = clientY - box.top;
            const dist = Math.hypot(centerX, centerY);
            const maxDist = Math.hypot(box.w, box.h) * 0.6;
            radius = Math.max(0, Math.min(100, 100 - (dist / maxDist * 100)));
            page1.style.clipPath = `circle(${radius}% at ${centerX}px ${centerY}px)`;
        }

        function startDrag(e) {
            if (e.touches) e.preventDefault();
            isDragging = true;
            document.addEventListener('mousemove', dragHandler);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', dragHandler, { passive: true });
            document.addEventListener('touchend', endDrag);
        }

        function endDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', dragHandler);
            document.removeEventListener('touchmove', dragHandler);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);
            if (radius <= 10) {
                page1.style.opacity = '0';
                foldCornerWrap.style.opacity = '0';
                setTimeout(() => {
                    page1.style.display = 'none';
                    foldCornerWrap.style.display = 'none';
                }, 300);
            }
        }

        foldCornerWrap.addEventListener('mousedown', startDrag);
        foldCornerWrap.addEventListener('touchstart', startDrag, { passive: false });
    }

    surpriseBtn.addEventListener('click', () => {
        startScreen.style.transition = 'opacity 0.6s ease';
        startScreen.style.opacity = '0';
        canvas.style.opacity = '0';
        setTimeout(() => {
            startScreen.style.display = 'none';
            giftBox.style.display = 'block';
            initGiftAnimation();
        }, 500);
    });

    initCanvas();
    runTypeEffect();
})();
