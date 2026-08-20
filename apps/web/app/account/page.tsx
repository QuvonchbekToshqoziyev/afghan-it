'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '../../components/site-header';
import { useLanguage } from '../../lib/language';

type Account = { id: string; name: string; email: string; preferredLocale: string; createdAt: string; roles?: string[] };
const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const copy = {
  en: { required: 'Sign in to view your account.', failed: 'Account details could not be loaded.', eyebrow: 'Personal account', title: 'My account', intro: 'Your profile and platform access settings.', loading: 'Loading account details…', signIn: 'Sign in', details: 'Profile details', name: 'Name', language: 'Language', created: 'Account created', dashboard: 'Go to dashboard', signOut: 'Sign out' },
  fa: { required: 'برای دیدن حساب خود وارد شوید.', failed: 'اطلاعات حساب بارگذاری نشد.', eyebrow: 'حساب شخصی', title: 'حساب من', intro: 'پروفایل و تنظیمات دسترسی شما.', loading: 'اطلاعات حساب در حال بارگذاری است…', signIn: 'ورود', details: 'اطلاعات پروفایل', name: 'نام', language: 'زبان', created: 'تاریخ ساخت حساب', dashboard: 'رفتن به داشبورد', signOut: 'خروج' },
  ps: { required: 'د خپل حساب د لیدلو لپاره ننوځئ.', failed: 'د حساب معلومات پورته نه شول.', eyebrow: 'شخصي حساب', title: 'زما حساب', intro: 'ستاسو پروفایل او د لاسرسي تنظیمات.', loading: 'د حساب معلومات پورته کېږي…', signIn: 'ننوتل', details: 'د پروفایل معلومات', name: 'نوم', language: 'ژبه', created: 'حساب جوړ شوی', dashboard: 'ډشبورډ ته لاړ شئ', signOut: 'وتل' }
};

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const { language } = useLanguage(); const c = copy[language];
  useEffect(() => { const token = sessionStorage.getItem('afghan-it.access-token'); if (!token) { setError(c.required); setLoading(false); return; } fetch(`${api}/me`, { headers: { authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : Promise.reject(new Error(c.failed))).then(setAccount).catch(e => setError(e.message)).finally(() => setLoading(false)); }, [c.required, c.failed]);
  function signOut() { sessionStorage.removeItem('afghan-it.access-token'); window.location.assign('/'); }
  return <main><SiteHeader /><section className="page-hero"><span className="eyebrow">{c.eyebrow}</span><h1>{c.title}</h1><p>{c.intro}</p></section>{loading && <p className="page-state">{c.loading}</p>}{error && <section className="page-state"><p>{error}</p><Link className="primary-button" href="/login">{c.signIn}</Link></section>}{account && <section className="account-layout"><div className="account-card"><div className="avatar">{account.name?.slice(0, 1).toUpperCase() || 'A'}</div><h2>{account.name}</h2><p>{account.email}</p><span className="account-role">{account.roles?.join(' · ') || 'Learner'}</span></div><div className="account-card account-details"><h2>{c.details}</h2><dl><div><dt>{c.name}</dt><dd>{account.name}</dd></div><div><dt>Email</dt><dd>{account.email}</dd></div><div><dt>{c.language}</dt><dd>{account.preferredLocale === 'fa' ? 'Dari' : account.preferredLocale === 'ps' ? 'Pashto' : 'English'}</dd></div><div><dt>{c.created}</dt><dd>{new Date(account.createdAt).toLocaleDateString(language)}</dd></div></dl><div className="account-actions"><Link className="primary-button" href="/dashboard">{c.dashboard}</Link><button className="danger-button" onClick={signOut}>{c.signOut}</button></div></div></section>}</main>;
}
