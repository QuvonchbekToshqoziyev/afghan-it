'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
type Summary = { users: number; courses: number; certificates: number; teachers: number };
type User = { id: string; name: string; email: string; preferredLocale: string; createdAt: string };

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => { const accessToken = sessionStorage.getItem('afghan-it.access-token'); if (!accessToken) return; const headers = { authorization: `Bearer ${accessToken}` }; fetch(`${api}/admin/dashboard`, { headers }).then((response) => response.ok ? response.json() : null).then(setSummary); fetch(`${api}/admin/users`, { headers }).then((response) => response.ok ? response.json() : []).then(setUsers); }, []);
  return <main><header className="masthead"><Link href="/" className="brand">Afghan <span>IT Academy</span></Link><Link href="/">Learner view</Link></header><section className="hero"><div className="eyebrow">Administration</div><h1>Keep the academy healthy.</h1><p>Monitor learners, teachers, courses, certificates, and subscriptions from one role-protected workspace.</p></section>{summary ? <div className="stats"><div className="stat"><strong>{summary.users}</strong>users</div><div className="stat"><strong>{summary.teachers}</strong>teachers</div><div className="stat"><strong>{summary.courses}</strong>courses</div></div> : <p className="notice">Sign in with an administrator account to see platform data.</p>}{users.length > 0 && <section className="learning-module"><div className="section-title"><h2>Recent users</h2><span>{summary?.certificates || 0} certificates issued</span></div>{users.map((user) => <div className="lesson" key={user.id}><div><strong>{user.name}</strong><small>{user.email} · {user.preferredLocale}</small></div><small>{new Date(user.createdAt).toLocaleDateString()}</small></div>)}</section>}</main>;
}
