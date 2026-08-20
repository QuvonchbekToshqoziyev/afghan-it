'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Lesson = { id: string; title: string; type: string; durationMinutes: number; content: string };
type Module = { id: string; title: string; lessons: Lesson[] };
type Course = { id: string; title: string; description: string; category: string; level: string; modules: Module[] };
const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [message, setMessage] = useState('');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => { fetch(`${api}/courses/${id}`).then(async (response) => response.ok ? response.json() : null).then(setCourse).catch(() => setCourse(null)); }, [id]);
  async function enroll() {
    const accessToken = sessionStorage.getItem('afghan-it.access-token');
    if (!accessToken) return setMessage('Create an account or sign in first.');
    const response = await fetch(`${api}/courses/${id}/enroll`, { method: 'POST', headers: { authorization: `Bearer ${accessToken}` } });
    setMessage(response.ok ? 'You are enrolled. Start with the first lesson.' : 'Unable to enroll right now.');
  }
  async function complete(lesson: Lesson) {
    const accessToken = sessionStorage.getItem('afghan-it.access-token');
    if (!accessToken) return setMessage('Sign in before recording progress.');
    const response = await fetch(`${api}/lessons/${lesson.id}/progress`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ percent: 100 }) });
    setMessage(response.ok ? 'Lesson completed. Finish every lesson to receive your certificate and 100 XP.' : 'Enroll before completing lessons.');
  }
  if (!course) return <main><p>Loading programme…</p></main>;
  return <main><header className="masthead"><Link href="/" className="brand">Afghan <span>IT Academy</span></Link><Link href="/#login">Sign in</Link></header><section className="hero"><div className="eyebrow">{course.category} · {course.level}</div><h1>{course.title}</h1><p>{course.description}</p><button onClick={enroll}>Enroll for free</button><p className="notice">{message}</p></section><section><div className="section-title"><h2>Course roadmap</h2><span>{course.modules.reduce((total, module) => total + module.lessons.length, 0)} lessons</span></div>{course.modules.length ? course.modules.map((module) => <article className="learning-module" key={module.id}><h3>{module.title}</h3>{module.lessons.map((lesson) => <div className="lesson" key={lesson.id}><div><strong>{lesson.title}</strong><small>{lesson.type} · {lesson.durationMinutes} min</small></div><div><button className="quiet" onClick={() => setActiveLesson(lesson)}>Open</button><button onClick={() => complete(lesson)}>Mark complete</button></div></div>)}</article>) : <p>This programme is being prepared by an instructor. Enrollment is open and the lesson roadmap will appear here when published.</p>}</section>{activeLesson && <section className="lesson-reader"><div className="section-title"><h2>{activeLesson.title}</h2><button className="quiet" onClick={() => setActiveLesson(null)}>Close</button></div><p>{activeLesson.content || 'Lesson material will be available here.'}</p><button onClick={() => complete(activeLesson)}>Mark lesson complete</button></section>}</main>;
}
