'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '../../components/site-header';
import { authFetch } from '../../lib/api';
import { useLanguage } from '../../lib/language';

const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
type Summary = { users: number; teachers: number; courses: number };
type User = { id: string; name: string; email: string; preferredLocale: string; createdAt: string };
type Certificate = { certificate: { verificationId: string }; learner: { name: string; email: string }; course: { title: string } };
type Subscription = { subscription: { status: string }; plan: { name: string }; learner: { name: string; email: string } };
const copy = {
  en: { eyebrow: 'Administration', title: 'Keep the academy healthy.', intro: 'Monitor learners, teachers, courses, certificates, and subscriptions from one protected workspace.', users: 'users', teachers: 'teachers', courses: 'courses', required: 'Sign in with an administrator account to see platform data.', recent: 'Recent users', certificates: 'Certificates', issued: 'issued', verify: 'Verify', subscriptions: 'Subscriptions' },
  fa: { eyebrow: 'مدیریت', title: 'آکادمی را سالم نگه دارید.', intro: 'دانشجویان، استادان، دوره‌ها، گواهی‌نامه‌ها و اشتراک‌ها را در یک محیط محافظت‌شده مدیریت کنید.', users: 'کاربر', teachers: 'استاد', courses: 'دوره', required: 'با حساب مدیر وارد شوید.', recent: 'کاربران تازه', certificates: 'گواهی‌نامه‌ها', issued: 'صادرشده', verify: 'بررسی', subscriptions: 'اشتراک‌ها' },
  ps: { eyebrow: 'اداره', title: 'اکاډمي سالمه وساتئ.', intro: 'زده‌کوونکي، ښوونکي، کورسونه، سندونه او ګډونونه له یوه خوندي ځایه وڅارئ.', users: 'کاروونکي', teachers: 'ښوونکي', courses: 'کورسونه', required: 'د مدیر حساب سره ننوځئ.', recent: 'وروستي کاروونکي', certificates: 'سندونه', issued: 'صادر شوي', verify: 'تایید', subscriptions: 'ګډونونه' }
};

export default function AdminPage() {
  const { language } = useLanguage(); const c = copy[language]; const [summary, setSummary] = useState<Summary | null>(null); const [users, setUsers] = useState<User[]>([]); const [certificates, setCertificates] = useState<Certificate[]>([]); const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  useEffect(() => { authFetch(`${api}/admin/dashboard`).then(response => response.ok ? response.json() : null).then(setSummary); authFetch(`${api}/admin/users`).then(response => response.ok ? response.json() : []).then(setUsers); authFetch(`${api}/admin/certificates`).then(response => response.ok ? response.json() : []).then(setCertificates); authFetch(`${api}/admin/subscriptions`).then(response => response.ok ? response.json() : []).then(setSubscriptions); }, []);
  return <main><SiteHeader /><section className="hero"><div className="eyebrow">{c.eyebrow}</div><h1>{c.title}</h1><p>{c.intro}</p></section>{summary ? <div className="stats"><div className="stat"><strong>{summary.users}</strong>{c.users}</div><div className="stat"><strong>{summary.teachers}</strong>{c.teachers}</div><div className="stat"><strong>{summary.courses}</strong>{c.courses}</div></div> : <p className="notice">{c.required}</p>}{users.length > 0 && <section className="learning-module"><div className="section-title"><h2>{c.recent}</h2></div>{users.map(user => <div className="lesson" key={user.id}><div><strong>{user.name}</strong><small>{user.email} · {user.preferredLocale}</small></div><small>{new Date(user.createdAt).toLocaleDateString(language)}</small></div>)}</section>}{certificates.length > 0 && <section className="learning-module"><div className="section-title"><h2>{c.certificates}</h2><span>{certificates.length} {c.issued}</span></div>{certificates.map(({ certificate, learner, course }) => <div className="lesson" key={certificate.verificationId}><div><strong>{learner.name} · {course.title}</strong><small>{learner.email}</small></div><a href={`/api/v1/certificates/verify/${certificate.verificationId}`} target="_blank" rel="noreferrer">{c.verify}</a></div>)}</section>}{subscriptions.length > 0 && <section className="learning-module"><div className="section-title"><h2>{c.subscriptions}</h2></div>{subscriptions.map(({ subscription, plan, learner }) => <div className="lesson" key={learner.email}><div><strong>{learner.name}</strong><small>{learner.email} · {plan.name}</small></div><small>{subscription.status}</small></div>)}</section>}</main>;
}
