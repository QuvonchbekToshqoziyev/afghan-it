'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

type Course = { id: string; slug: string; title: string; description: string; category: string; level: string };
type Dashboard = { completedLessons: number; xp: number; certificates: unknown[]; enrollments: unknown[] };
type Locale = 'en' | 'fa' | 'ps';

const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const copy = {
  en: { signIn: 'Sign in', eyebrow: 'Built for practical progress', title: 'Learn the work that moves your future.', hero: 'IT and English programmes with real projects, assessments, AI mentoring and verifiable certificates.', explore: 'Explore programmes', available: 'available', continue: 'Continue learning', email: 'Email', password: 'Password', active: 'active courses', lessons: 'lessons completed', xp: 'XP earned', dashboard: 'Your learning dashboard', failed: 'Unable to sign in.', signed: 'Signed in. Your learning dashboard is ready.' },
  fa: { signIn: 'ورود', eyebrow: 'برای پیشرفت عملی ساخته شده', title: 'مهارت‌هایی را بیاموزید که آینده‌تان را می‌سازند.', hero: 'دوره‌های آی‌تی و انگلیسی با پروژه‌های عملی، آزمون، راهنمای هوش مصنوعی و سند قابل تایید.', explore: 'برنامه‌ها را ببینید', available: 'دوره موجود', continue: 'یادگیری را ادامه دهید', email: 'ایمیل', password: 'رمز عبور', active: 'دوره فعال', lessons: 'درس تکمیل‌شده', xp: 'امتیاز XP', dashboard: 'داشبورد یادگیری شما', failed: 'ورود ممکن نشد.', signed: 'وارد شدید؛ داشبورد شما آماده است.' },
  ps: { signIn: 'ننوتل', eyebrow: 'د عملي پرمختګ لپاره', title: 'هغه مهارتونه زده کړئ چې راتلونکی مو جوړوي.', hero: 'د آی ټي او انګلیسي کورسونه له عملي پروژو، ازموینو، AI لارښود او د تایید وړ سندونو سره.', explore: 'پروګرامونه وپلټئ', available: 'شته کورسونه', continue: 'زده کړه روانه وساتئ', email: 'برېښنالیک', password: 'پټنوم', active: 'فعال کورسونه', lessons: 'بشپړ شوي درسونه', xp: 'XP نمرې', dashboard: 'ستاسو د زده کړې ډشبورډ', failed: 'ننوتل ممکن نه شول.', signed: 'ننوتل بریالي شول؛ ډشبورډ چمتو دی.' },
} as const;

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [locale, setLocale] = useState<Locale>('en');
  const [mentorMessage, setMentorMessage] = useState('');
  const [mentorAnswer, setMentorAnswer] = useState('');
  const text = copy[locale];

  useEffect(() => {
    fetch(`${api}/courses`, { credentials: 'include' }).then((response) => response.ok ? response.json() : []).then(setCourses).catch(() => setCourses([]));
  }, []);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${api}/auth/${isRegistering ? 'register' : 'login'}`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(isRegistering ? { email, password, name, preferredLocale: locale } : { email, password }) });
    if (!response.ok) return setMessage(text.failed);
    const session = await response.json() as { accessToken: string };
    sessionStorage.setItem('afghan-it.access-token', session.accessToken);
    const summary = await fetch(`${api}/dashboard`, { headers: { authorization: `Bearer ${session.accessToken}` }, credentials: 'include' });
    if (summary.ok) setDashboard(await summary.json());
    setMessage(text.signed);
  }

  async function askMentor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessToken = sessionStorage.getItem('afghan-it.access-token');
    if (!accessToken) return setMentorAnswer('Sign in to use AI Mentor.');
    const response = await fetch(`${api}/ai/mentor`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ message: mentorMessage }) });
    const data = await response.json().catch(() => ({})) as { answer?: string; message?: string };
    setMentorAnswer(data.answer || data.message || 'AI Mentor is unavailable right now.');
  }

  return <main dir={locale === 'en' ? 'ltr' : 'rtl'}>
    <header className="masthead"><div className="brand">Afghan <span>IT Academy</span></div><div><button className="language" onClick={() => setLocale(locale === 'en' ? 'fa' : locale === 'fa' ? 'ps' : 'en')}>{locale === 'en' ? 'دری' : locale === 'fa' ? 'پښتو' : 'English'}</button><a href="#login">{text.signIn}</a></div></header>
    <section className="hero"><div className="eyebrow">{text.eyebrow}</div><h1>{text.title}</h1><p>{text.hero}</p></section>
    <section aria-labelledby="courses"><div className="section-title"><h2 id="courses">{text.explore}</h2><span>{courses.length} {text.available}</span></div><div className="course-grid">{courses.map((course) => <article className="course" key={course.id}><small>{course.category} · {course.level}</small><h3>{course.title}</h3><p>{course.description}</p><Link href={`/courses/${course.id}`}>View programme →</Link></article>)}</div></section>
    <section className="login" id="login" aria-labelledby="login-title"><div className="section-title"><h2 id="login-title">{isRegistering ? 'Create your learner account' : text.continue}</h2><button className="quiet" type="button" onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? text.signIn : 'Create account'}</button></div><form onSubmit={authenticate}>{isRegistering && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>}<label>{text.email}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>{text.password}<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button>{isRegistering ? 'Create account' : text.signIn}</button></form><p className="notice" role="status">{message}</p></section>
    {dashboard && <section className="dashboard" aria-labelledby="dashboard-title"><div className="section-title"><h2 id="dashboard-title">{text.dashboard}</h2></div><div className="stats"><div className="stat"><strong>{dashboard.enrollments.length}</strong>{text.active}</div><div className="stat"><strong>{dashboard.completedLessons}</strong>{text.lessons}</div><div className="stat"><strong>{dashboard.xp}</strong>{text.xp}</div></div></section>}
    <section className="login" aria-labelledby="mentor-title"><div className="section-title"><h2 id="mentor-title">AI Mentor</h2></div><form onSubmit={askMentor}><label>Ask about IT, English, code, or homework<input value={mentorMessage} onChange={(event) => setMentorMessage(event.target.value)} required /></label><button>Ask AI Mentor</button></form><p className="notice" role="status">{mentorAnswer}</p></section>
  </main>;
}
