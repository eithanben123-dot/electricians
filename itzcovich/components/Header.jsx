'use client';
import { useEffect, useState } from 'react';
import { AGENCY } from '@/lib/data';
import { Phone, WhatsApp, Menu, Close } from './Icons';

const LINKS = [['#properties', 'נכסים'], ['#services', 'שירותים'], ['#areas', 'אזורים'], ['#about', 'אודות'], ['#sell', 'הערכת שווי'], ['#contact', 'צור קשר']];

export function Brand({ light }) {
  return (
    <span className="brand">
      <span className="brand__mark" aria-hidden="true">IP</span>
      <span className="brand__text"><b>{AGENCY.name}</b><small>ITZCOVICH PROPERTIES</small></span>
    </span>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const c = () => setOpen(false); document.addEventListener('nav:close', c); return () => document.removeEventListener('nav:close', c); }, []);
  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a href="#top" aria-label={`${AGENCY.name} — לראש העמוד`}><Brand /></a>
          <nav className="nav" aria-label="ניווט ראשי">{LINKS.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav>
          <div className="header-actions">
            <a className="icon-btn" href={`tel:${AGENCY.phoneOffice.replace(/-/g, '')}`} aria-label={`התקשרו: ${AGENCY.phoneOffice}`}><Phone /></a>
            <a className="icon-btn icon-btn--wa" href={`https://wa.me/${AGENCY.whatsapp}`} target="_blank" rel="noopener" aria-label="וואטסאפ"><WhatsApp /></a>
            <a className="btn btn--dark btn--sm" href="#properties">לצפייה בנכסים</a>
            <button className="icon-btn burger" type="button" aria-expanded={open} aria-controls="drawer" aria-label={open ? 'סגירת תפריט' : 'פתיחת תפריט'} onClick={() => setOpen(!open)}>{open ? <Close /> : <Menu />}</button>
          </div>
        </div>
      </header>
      {open && (
        <div className="drawer" id="drawer">
          <nav aria-label="תפריט נייד">{LINKS.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav>
        </div>
      )}
    </>
  );
}
