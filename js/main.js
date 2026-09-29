/* Papa Sam Pizza — interactions (GSAP + ScrollTrigger + Lenis) */
(function () {
    'use strict';

    var WA_NUMBER = '918288824747';
    var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function waLink(text) {
        return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
    }

    /* ---------- Mobile menu (works without GSAP) ---------- */
    var burger = document.querySelector('.burger');
    var mobileMenu = document.querySelector('.mobile-menu');
    var lenis = null;

    function toggleMenu(open) {
        if (!burger || !mobileMenu) return;
        burger.classList.toggle('open', open);
        document.body.classList.toggle('menu-open', open);
        mobileMenu.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open);
        if (lenis) open ? lenis.stop() : lenis.start();
        if (hasGsap) {
            gsap.to(mobileMenu, { clipPath: open ? 'circle(150% at calc(100% - 44px) 44px)' : 'circle(0% at calc(100% - 44px) 44px)', duration: .8, ease: 'power3.inOut' });
            if (open) gsap.fromTo('.mobile-menu .m-link, .mobile-menu .m-info', { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: .07, delay: .3, duration: .7, ease: 'power3.out' });
        } else {
            mobileMenu.style.clipPath = open ? 'none' : '';
        }
    }
    if (burger) {
        burger.addEventListener('click', function () { toggleMenu(!burger.classList.contains('open')); });
        document.querySelectorAll('.mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });
    }

    /* ---------- WhatsApp enquiry forms ---------- */
    document.querySelectorAll('form[data-wa]').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.reportValidity(); return; }
            var d = new FormData(form);
            var lines = ['Hi Papa Sam Pizza! 🍕 ' + (form.dataset.wa || 'Enquiry')];
            d.forEach(function (v, k) { if (String(v).trim()) lines.push('*' + k + ':* ' + v); });
            window.open(waLink(lines.join('\n')), '_blank', 'noopener');
        });
    });
    document.querySelectorAll('[data-wa-item]').forEach(function (a) {
        a.href = waLink('Hi Papa Sam Pizza! 🍕 I would like to enquire about: ' + a.dataset.waItem);
        a.target = '_blank'; a.rel = 'noopener';
    });
    document.querySelectorAll('[data-wa-text]').forEach(function (a) {
        a.href = waLink(a.dataset.waText);
        a.target = '_blank'; a.rel = 'noopener';
    });

    /* ---------- Menu filters ---------- */
    var filters = document.querySelectorAll('.filter-btn');
    filters.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filters.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var f = btn.dataset.filter;
            document.querySelectorAll('.menu-group').forEach(function (g) {
                g.style.display = (f === 'all' || g.dataset.group === f) ? '' : 'none';
            });
            if (hasGsap) {
                gsap.fromTo('.menu-group:not([style*="none"]) .menu-item', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: .04, duration: .5, ease: 'power2.out' });
                ScrollTrigger.refresh();
            }
        });
    });

    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    if (!hasGsap) {   // page stays fully usable without animation
        var p0 = document.querySelector('.preloader');
        if (p0) p0.remove();
        return;
    }

    document.documentElement.classList.add('js');
    gsap.registerPlugin(ScrollTrigger);

    /* ---------- Smooth scroll ---------- */
    if (typeof window.Lenis !== 'undefined' && !reduced) {
        lenis = new Lenis({ duration: 1.2, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var t = document.querySelector(a.getAttribute('href'));
                if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80 }); }
            });
        });
    }

    /* ---------- Header behaviour + progress ---------- */
    var header = document.querySelector('.site-header');
    var lastY = 0;
    ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: function (self) {
            var y = self.scroll();
            if (header) {
                header.classList.toggle('scrolled', y > 60);
                var hide = y > lastY && y > 500;
                header.classList.toggle('hide', hide);
                document.documentElement.style.setProperty('--sticky-top', hide ? '14px' : '88px');
            }
            lastY = y;
        }
    });
    gsap.to('.progress-bar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

    /* ---------- Custom cursor ---------- */
    var cursor = document.querySelector('.cursor');
    if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        gsap.set(cursor, { xPercent: -50, yPercent: -50 });
        var cx = gsap.quickTo(cursor, 'x', { duration: .25, ease: 'power3' });
        var cy = gsap.quickTo(cursor, 'y', { duration: .25, ease: 'power3' });
        window.addEventListener('mousemove', function (e) { cx(e.clientX); cy(e.clientY); });
        document.querySelectorAll('a, button, .pizza-card, .menu-item').forEach(function (el) {
            el.addEventListener('mouseenter', function () { gsap.to(cursor, { scale: 3, duration: .3 }); });
            el.addEventListener('mouseleave', function () { gsap.to(cursor, { scale: 1, duration: .3 }); });
        });
    }

    /* ---------- Split headings into words ---------- */
    function splitWords(el) {
        (function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (n) {
                if (n.nodeType === 3) {
                    var frag = document.createDocumentFragment();
                    n.textContent.split(/(\s+)/).forEach(function (part) {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        var w = document.createElement('span'); w.className = 'w';
                        var i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
                        w.appendChild(i); frag.appendChild(w);
                    });
                    n.parentNode.replaceChild(frag, n);
                } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
            });
        })(el);
    }
    document.querySelectorAll('[data-split]').forEach(splitWords);

    /* ---------- Preloader → intro ---------- */
    var pre = document.querySelector('.preloader');
    var cameByLink = false;
    try { cameByLink = sessionStorage.getItem('psNav') === '1'; sessionStorage.removeItem('psNav'); } catch (e) { }
    var introDone = false;
    function intro() {
        if (introDone) return; introDone = true;
        var tl = gsap.timeline();
        if (pre) tl.to(pre, { yPercent: -100, duration: cameByLink ? .8 : .9, ease: 'power4.inOut', delay: cameByLink ? .1 : .5, onComplete: function () { pre.remove(); } });
        var heroWords = document.querySelectorAll('.hero [data-split] .wi, .page-hero [data-split] .wi');
        tl.from(heroWords, { yPercent: 115, rotate: 6, stagger: .06, duration: 1, ease: 'power4.out' }, pre ? '-=.35' : 0)
            .from('.hero-tag, .page-hero .eyebrow, .crumbs', { y: 20, opacity: 0, duration: .7 }, '<')
            .from('.hero-sub, .page-hero p', { y: 30, opacity: 0, duration: .8 }, '-=.6')
            .from('.hero-actions > *', { y: 30, opacity: 0, stagger: .1, duration: .7 }, '-=.5')
            .from('.hero-pizza', { scale: .4, rotate: -140, opacity: 0, duration: 1.6, ease: 'elastic.out(1,.7)' }, '-=1.2')
            .from('.float-topping', { scale: 0, rotate: -90, stagger: .1, duration: .8, ease: 'back.out(2)' }, '-=1')
            .from('.hero-badge', { scale: 0, rotate: 60, duration: .8, ease: 'back.out(2)' }, '-=.6')
            .from('.page-hero .deco', { x: 200, rotate: -90, opacity: 0, duration: 1.4, ease: 'power3.out' }, '-=1.4');
    }
    window.addEventListener('load', intro);
    if (document.readyState === 'complete') intro();

    /* ---------- Hero idle + parallax ---------- */
    if (document.querySelector('.hero-pizza')) {
        gsap.to('.hero-pizza', { rotate: 360, duration: 60, repeat: -1, ease: 'none' });
        gsap.to('.hero-pizza', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
        document.querySelectorAll('.float-topping').forEach(function (t, i) {
            gsap.to(t, { y: (i % 2 ? -1 : 1) * 24, rotate: (i % 2 ? 1 : -1) * 25, duration: 2.5 + i * .4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
            gsap.to(t, { yPercent: -80 - i * 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
        });
        var hv = document.querySelector('.hero-visual');
        hv.addEventListener('mousemove', function (e) {
            var r = hv.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            gsap.to('.hero-badge', { x: x * 40, y: y * 40, duration: .6 });
            gsap.to('.float-topping', { x: x * 30, duration: .8 });
        });
    }
    document.querySelectorAll('.page-hero .float-topping').forEach(function (t, i) {
        gsap.to(t, { y: (i % 2 ? -1 : 1) * 22, rotate: (i % 2 ? 1 : -1) * 20, duration: 2.4 + i * .4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
    gsap.utils.toArray('.deco').forEach(function (d) {
        gsap.to(d, { rotate: '+=90', ease: 'none', scrollTrigger: { trigger: d, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ---------- Scroll reveals ---------- */
    gsap.utils.toArray('.reveal').forEach(function (el) {
        gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    gsap.utils.toArray('[data-stagger]').forEach(function (wrap) {
        var kids = wrap.children;
        gsap.from(kids, { y: 70, opacity: 0, stagger: .12, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    });
    gsap.utils.toArray('[data-split]').forEach(function (h) {
        if (h.closest('.hero, .page-hero')) return;
        gsap.from(h.querySelectorAll('.wi'), { yPercent: 115, rotate: 5, stagger: .05, duration: .9, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
    });
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
        var s = parseFloat(el.dataset.parallax) || 60;
        gsap.fromTo(el, { y: -s }, { y: s, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray('[data-spin]').forEach(function (el) {
        gsap.to(el, { rotate: parseFloat(el.dataset.spin) || 180, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ---------- Counters ---------- */
    gsap.utils.toArray('[data-count]').forEach(function (el) {
        var end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
        var o = { v: 0 };
        gsap.to(o, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onUpdate: function () { el.textContent = o.v.toFixed(dec) + (el.dataset.suffix || ''); } });
    });

    /* ---------- Infinite loops (marquees + review rail) ---------- */
    function infiniteLoop(track, dir, speed) {
        var originals = Array.prototype.slice.call(track.children), tween = null;
        function build() {
            if (tween) tween.kill();
            track.querySelectorAll('[data-clone]').forEach(function (c) { c.remove(); });
            gsap.set(track, { x: 0 });
            var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            var last = originals[originals.length - 1];
            var period = last.offsetLeft + last.offsetWidth + gap - originals[0].offsetLeft;
            if (!period) return;
            var copies = Math.ceil(track.parentElement.offsetWidth / period) + 1;   // always enough to fill the screen
            for (var i = 0; i < copies; i++) originals.forEach(function (el) {
                var c = el.cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true'); track.appendChild(c);
            });
            tween = gsap.fromTo(track, { x: dir < 0 ? 0 : -period }, { x: dir < 0 ? -period : 0, duration: period / speed, ease: 'none', repeat: -1 });
        }
        build();
        var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 200); });
        window.addEventListener('load', build);
        ScrollTrigger.create({ onUpdate: function (st) {
            if (!tween) return;
            gsap.to(tween, { timeScale: 1 + Math.min(Math.abs(st.getVelocity()) / 500, 5), duration: .3, overwrite: true });
            gsap.to(tween, { timeScale: 1, delay: .3, duration: 1 });
        } });
        return { pause: function () { tween && tween.pause(); }, play: function () { tween && tween.play(); } };
    }
    document.querySelectorAll('.marquee-track').forEach(function (track) {
        infiniteLoop(track, track.closest('.marquee').classList.contains('navy') ? 1 : -1, 90);
    });
    document.querySelectorAll('.review-track').forEach(function (track) {
        var loop = infiniteLoop(track, -1, 55);
        track.addEventListener('mouseenter', loop.pause);
        track.addEventListener('mouseleave', loop.play);
    });

    /* ---------- Horizontal pinned scroll ---------- */
    var hs = document.querySelector('.hscroll');
    if (hs) {
        var track = hs.querySelector('.hscroll-track');
        ScrollTrigger.matchMedia({
            '(min-width: 768px)': function () {
                var dist = function () { return track.scrollWidth - window.innerWidth; };
                gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
                    scrollTrigger: { trigger: hs, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true,
                        onUpdate: function (s) { gsap.set('.hscroll-progress i', { width: (s.progress * 100) + '%' }); } } });
            },
            '(max-width: 767px)': function () {
                if (typeof window.Swiper === 'undefined') {   // fallback: native swipe scrolling
                    hs.style.overflowX = 'auto';
                    return function () { hs.style.overflowX = ''; };
                }
                var sw = new Swiper('.pizza-swiper', {
                    wrapperClass: 'hscroll-track', slideClass: 'pizza-card',
                    slidesPerView: 1.12, spaceBetween: 16, centeredSlides: true, grabCursor: true, speed: 550,
                    pagination: { el: '.pizza-pagination', clickable: true }
                });
                return function () { sw.destroy(true, true); };
            }
        });
    }

    /* ---------- Step connector ---------- */
    var line = document.querySelector('.steps-line');
    if (line) gsap.from(line, { scaleX: 0, ease: 'none', scrollTrigger: { trigger: line, start: 'top 80%', end: 'top 30%', scrub: true } });

    /* ---------- Stack cards scale as they get covered ---------- */
    gsap.utils.toArray('.stack-card').forEach(function (card, i, all) {
        if (i === all.length - 1 || window.innerWidth < 768) return;
        gsap.to(card, { scale: .94, ease: 'none', scrollTrigger: { trigger: all[i + 1], start: 'top 80%', end: 'top 20%', scrub: true } });
    });

    /* ---------- Tilt cards ---------- */
    document.querySelectorAll('.package, .offer, .feature').forEach(function (c) {
        c.addEventListener('mousemove', function (e) {
            var r = c.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            gsap.to(c, { rotateY: x * 8, rotateX: -y * 8, transformPerspective: 800, duration: .4 });
        });
        c.addEventListener('mouseleave', function () { gsap.to(c, { rotateY: 0, rotateX: 0, duration: .6 }); });
    });

    /* ---------- Magnetic buttons ---------- */
    document.querySelectorAll('.btn-ps').forEach(function (b) {
        b.addEventListener('mousemove', function (e) {
            var r = b.getBoundingClientRect();
            gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .2, duration: .3 });
        });
        b.addEventListener('mouseleave', function () { gsap.to(b, { x: 0, duration: .5, ease: 'elastic.out(1,.5)' }); });
    });

    /* ---------- Page transition (exit) ---------- */
    var leaving = false;
    function normalizePath(p) {
        if (!p) return '/';
        if (!/\/$/.test(p)) { p = /\.[a-z0-9]+$/i.test(p) ? p.slice(0, p.lastIndexOf('/') + 1) : p + '/'; }
        return p;
    }
    document.querySelectorAll('a[href]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (!/^\/(?:[a-z0-9-]+\/)?(#.*)?$/i.test(href) || a.target === '_blank') return;
        a.addEventListener('click', function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || leaving) return;
            var samePage = normalizePath(href.split('#')[0]) === normalizePath(location.pathname);
            if (samePage) return;
            e.preventDefault(); leaving = true;
            toggleMenu(false);
            var wipe = document.createElement('div');
            wipe.className = 'preloader wipe';
            wipe.innerHTML = '<div class="preloader-inner"><img src="/images/hero-pizza.webp" alt=""><p>Firing up the oven…</p></div>';
            document.body.appendChild(wipe);
            gsap.set(wipe, { yPercent: 100 });
            gsap.timeline({ onComplete: function () { try { sessionStorage.setItem('psNav', '1'); } catch (err) { } location.href = a.href; } })
                .to(wipe, { yPercent: 0, duration: .75, ease: 'power4.inOut' })
                .from(wipe.querySelector('.preloader-inner'), { y: 40, opacity: 0, duration: .4 }, '-=.3');
        });
    });
    window.addEventListener('pageshow', function (e) {   // back button (bfcache): clear any leftover cover
        if (e.persisted) { leaving = false; document.querySelectorAll('.preloader.wipe').forEach(function (w) { w.remove(); }); }
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
