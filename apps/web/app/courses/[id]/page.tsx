'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type Lesson = { id: string; title: string; type: string; durationMinutes: number; content: string };
type Module = { id: string; title: string; lessons: Lesson[] };
type Course = { id: string; title: string; description: string; category: string; level: string; modules: Module[] };
type Question = { id: string; prompt: string; kind: string; options: string[]; points: number };
const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [message, setMessage] = useState('');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [assessment, setAssessment] = useState<{ lesson: Lesson; questions: Question[] } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
  async function openAssessment(lesson: Lesson) {
    const accessToken = sessionStorage.getItem('afghan-it.access-token');
    if (!accessToken) return setMessage('Sign in before opening an assessment.');
    const response = await fetch(`${api}/lessons/${lesson.id}/assessment`, { headers: { authorization: `Bearer ${accessToken}` } });
    if (!response.ok) return setMessage('Enroll before opening this assessment.');
    setAnswers({});
    setAssessment({ lesson, questions: await response.json() });
  }
  async function submitAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assessment) return;
    const accessToken = sessionStorage.getItem('afghan-it.access-token');
    const response = await fetch(`${api}/lessons/${assessment.lesson.id}/attempt`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ answers }) });
    const result = await response.json().catch(() => ({})) as { passed?: boolean; score?: number; message?: string };
    setMessage(result.passed ? `Assessment passed with ${result.score}%. Continue to the next lesson.` : result.message || `Assessment score: ${result.score ?? 0}%. Try again.`);
    if (result.passed) setAssessment(null);
  }
  if (!course) return <main><p>Loading programme…</p></main>;
  return <main><header className="masthead"><Link href="/" className="brand">Afghan <span>IT Academy</span></Link><Link href="/#login">Sign in</Link></header><section className="hero"><div className="eyebrow">{course.category} · {course.level}</div><h1>{course.title}</h1><p>{course.description}</p><button onClick={enroll}>Enroll for free</button><p className="notice">{message}</p></section><section><div className="section-title"><h2>Course roadmap</h2><span>{course.modules.reduce((total, module) => total + module.lessons.length, 0)} lessons</span></div>{course.modules.length ? course.modules.map((module) => <article className="learning-module" key={module.id}><h3>{module.title}</h3>{module.lessons.map((lesson) => <div className="lesson" key={lesson.id}><div><strong>{lesson.title}</strong><small>{lesson.type} · {lesson.durationMinutes} min</small></div><div>{['quiz', 'practical', 'exam'].includes(lesson.type) ? <button onClick={() => openAssessment(lesson)}>Open assessment</button> : <><button className="quiet" onClick={() => setActiveLesson(lesson)}>Open</button><button onClick={() => complete(lesson)}>Mark complete</button></>}</div></div>)}</article>) : <p>This programme is being prepared by an instructor. Enrollment is open and the lesson roadmap will appear here when published.</p>}</section>{activeLesson && <section className="lesson-reader"><div className="section-title"><h2>{activeLesson.title}</h2><button className="quiet" onClick={() => setActiveLesson(null)}>Close</button></div><p>{activeLesson.content || 'Lesson material will be available here.'}</p><button onClick={() => complete(activeLesson)}>Mark lesson complete</button></section>}{assessment && <section className="lesson-reader"><div className="section-title"><h2>{assessment.lesson.title}</h2><button className="quiet" onClick={() => setAssessment(null)}>Close</button></div><form onSubmit={submitAssessment} className="assessment-form">{assessment.questions.map((question) => <fieldset key={question.id}><legend>{question.prompt}</legend>{question.options.length ? question.options.map((option) => <label key={option}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers({ ...answers, [question.id]: option })} required />{option}</label>) : <textarea value={answers[question.id] || ''} onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} minLength={20} required placeholder="Submit your explanation or solution" />}</fieldset>)}<button>Submit assessment</button></form></section>}</main>;
}
