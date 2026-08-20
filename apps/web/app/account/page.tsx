'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '../../components/site-header';

type Account = { id: string; name: string; email: string; preferredLocale: string; createdAt: string; roles?: string[] };
const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { const token = sessionStorage.getItem('afghan-it.access-token'); if (!token) { setError('Hisobingizga kirish talab qilinadi.'); setLoading(false); return; } fetch(`${api}/me`, { headers: { authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : Promise.reject(new Error('Hisob ma’lumotlari yuklanmadi'))).then(setAccount).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  function signOut() { sessionStorage.removeItem('afghan-it.access-token'); window.location.assign('/'); }
  return <main><SiteHeader /><section className="page-hero"><span className="eyebrow">Shaxsiy hisob</span><h1>Mening hisobim</h1><p>Profilingiz va platformadagi kirish sozlamalari.</p></section>{loading && <p className="page-state">Hisob ma’lumotlari yuklanmoqda…</p>}{error && <section className="page-state"><p>{error}</p><Link className="primary-button" href="/login">Kirish</Link></section>}{account && <section className="account-layout"><div className="account-card"><div className="avatar">{account.name?.slice(0, 1).toUpperCase() || 'A'}</div><h2>{account.name}</h2><p>{account.email}</p><span className="account-role">{account.roles?.join(' · ') || 'Learner'}</span></div><div className="account-card account-details"><h2>Profil ma’lumotlari</h2><dl><div><dt>Ism</dt><dd>{account.name}</dd></div><div><dt>Email</dt><dd>{account.email}</dd></div><div><dt>Til</dt><dd>{account.preferredLocale || 'uz'}</dd></div><div><dt>Hisob yaratilgan</dt><dd>{new Date(account.createdAt).toLocaleDateString()}</dd></div></dl><div className="account-actions"><Link className="primary-button" href="/dashboard">Dashboardga o‘tish</Link><button className="danger-button" onClick={signOut}>Chiqish</button></div></div></section>}</main>;
}
