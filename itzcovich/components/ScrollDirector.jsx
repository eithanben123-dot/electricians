'use client';
/**
 * Smooth scroll (Lenis) + GSAP ScrollTrigger + the bridge to the 3D world:
 * measures every [data-stage] section into scroll.anchors, keeps scroll.y and
 * the pointer up to date, runs reveal animations and handles in-page links.
 */
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { scroll } from '@/lib/scroll';

export default function ScrollDirector() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroll.reduced = reduced;
    const lenis = reduced ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, autoRaf: false });
    window.__lenis = lenis;
    if (lenis) lenis.on('scroll', ScrollTrigger.update);
    const tick = (t) => { lenis?.raf(t * 1000); scroll.y = lenis ? lenis.animatedScroll : window.scrollY; };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const measure = () => {
      scroll.vh = innerHeight;
      scroll.anchors = [...document.querySelectorAll('[data-stage]')].map((el) => {
        const start = el.getBoundingClientRect().top + window.scrollY;
        return { name: el.dataset.stage, start, end: Math.max(start, start + el.offsetHeight - innerHeight) };
      });
    };
    measure();
    const ro = new ResizeObserver(() => { measure(); ScrollTrigger.refresh(); });
    ro.observe(document.body);

    const onPointer = (e) => { scroll.pointer.x = (e.clientX / innerWidth) * 2 - 1; scroll.pointer.y = -(e.clientY / innerHeight) * 2 + 1; };
    addEventListener('pointermove', onPointer, { passive: true });

    // reveals
    gsap.set('[data-reveal]', { opacity: 0, y: 26 });
    ScrollTrigger.batch('[data-reveal]', { start: 'top 88%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: reduced ? 0 : 1, stagger: reduced ? 0 : 0.08, ease: 'power3.out', overwrite: true }) });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.25 });
    document.querySelectorAll('.img-reveal').forEach((el) => io.observe(el));

    // in-page links (header, CTAs, footer)
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('nav:close'));
      const offset = el.hasAttribute('data-stage') ? 0 : -(document.querySelector('.site-header')?.offsetHeight || 0);
      if (lenis) lenis.scrollTo(el, { offset, duration: 1.6 });
      else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset });
      history.replaceState(null, '', a.getAttribute('href'));
    };
    document.addEventListener('click', onClick);

    // header state
    const header = document.querySelector('.site-header');
    const st = ScrollTrigger.create({ start: 20, onToggle: (s) => header?.classList.toggle('is-stuck', s.isActive) });

    return () => {
      gsap.ticker.remove(tick); lenis?.destroy(); ro.disconnect(); io.disconnect(); st.kill();
      removeEventListener('pointermove', onPointer); document.removeEventListener('click', onClick);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
  return null;
}

/** progress (0..1) through a pinned section, reported as a step index */
export function usePinSteps(ref, steps, onStep) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let last = -1;
    const st = ScrollTrigger.create({
      trigger: ref.current, start: 'top top', end: 'bottom bottom',
      onUpdate: (s) => { const i = Math.min(steps - 1, Math.floor(s.progress * steps)); if (i !== last) { last = i; onStep(i); } },
    });
    return () => st.kill();
  }, [ref, steps, onStep]);
}
