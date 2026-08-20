'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
type Summary = { courses: number; learners: number; enrollments: number };

export default function TeacherPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ title: '', slug: '', category: 'IT', description: '' });
  const token = () => sessionStorage.getItem('afghan-it.access-token');
  useEffect(() => { const accessToken = token(); if (accessToken) fetch(`${api}/teacher/dashboard`, { headers: { authorization: `Bearer ${accessToken}` } }).then((response) => response.ok ? response.json() : null).then(setSummary); }, []);
  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${api}/teacher/courses`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token()}` }, body: JSON.stringify({ ...form, published: false }) });
    setMessage(response.ok ? 'Draft course created. Add modules and lessons through the teacher API.' : 'Teacher access is required to create a course.');
    if (response.ok) setForm({ title: '', slug: '', category: 'IT', description: '' });
  }
  return <main><header className="masthead"><Link href="/" className="brand">Afghan <span>IT Academy</span></Link><Link href="/">Learner view</Link></header><section className="hero"><div className="eyebrow">Teacher studio</div><h1>Build learning that learners can finish.</h1><p>Create structured courses, modules, and lessons. Only teacher and administrator accounts can publish content.</p></section>{summary ? <div className="stats"><div className="stat"><strong>{summary.courses}</strong>courses</div><div className="stat"><strong>{summary.learners}</strong>learners</div><div className="stat"><strong>{summary.enrollments}</strong>enrollments</div></div> : <p className="notice">Sign in with a teacher account to see the teaching dashboard.</p>}<section className="login"><div className="section-title"><h2>New course draft</h2></div><form onSubmit={createCourse}><label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label>URL slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required /></label><label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></label><label>Description<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><button>Create draft</button></form><p className="notice">{message}</p></section></main>;
}
