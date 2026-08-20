'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false); const [language, setLanguage] = useState('fa');
  useEffect(() => { setSignedIn(Boolean(sessionStorage.getItem('afghan-it.access-token'))); setLanguage(localStorage.getItem('afghan-it.language') || 'fa'); }, []);
  function changeLanguage(value: string) { setLanguage(value); localStorage.setItem('afghan-it.language', value); document.documentElement.lang = value; }
  return <header className="masthead"><Link className="brand" href="/"><span className="brand-mark">◆</span><span>Afghan IT<small>Academy</small></span></Link><nav><Link href="/courses">Kurslar</Link><Link href="/courses?category=it">IT yo‘nalishlar</Link><Link href="/courses?category=english">Ingliz tili</Link><Link href="/mentor">AI Mentor</Link><a href="/#footer">Biz haqimizda</a></nav><div className="header-actions"><button className="search" aria-label="Search">⌕</button><label className="language-select"><span>Til</span><select aria-label="Tilni tanlang" value={language} onChange={event => changeLanguage(event.target.value)}><option value="fa">Dari</option><option value="ps">Pashto</option><option value="en">English</option></select><b>⌄</b></label>{signedIn ? <Link className="header-button" href="/account">Mening hisobim</Link> : <><Link className="outline-button" href="/login">Kirish</Link><Link className="header-button" href="/login?register=1">Ro‘yxatdan o‘tish</Link></>}</div></header>;
}
