'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '../../components/site-header';
import { useLanguage } from '../../lib/language';

type Course = { id: string; title: string; description: string; category: string; level: string; accessTier: string };
const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const copy = {
  en: { title: 'Choose the right course for you.', intro: 'Practical programs for IT, English, and future careers.', results: 'results', it: 'IT courses', english: 'English courses', all: 'All courses', search: 'Search courses...', free: 'FREE', view: 'View course →', empty: 'No courses found', tryAgain: 'Try a different search term.' },
  fa: { title: 'دوره مناسب خود را انتخاب کنید.', intro: 'برنامه‌های عملی برای آی‌تی، انگلیسی و حرفه‌های آینده.', results: 'نتیجه', it: 'دوره‌های آی‌تی', english: 'دوره‌های انگلیسی', all: 'همه دوره‌ها', search: 'جستجوی دوره‌ها...', free: 'رایگان', view: 'مشاهده دوره →', empty: 'دوره‌ای پیدا نشد', tryAgain: 'عبارت دیگری را جستجو کنید.' },
  ps: { title: 'خپل مناسب کورس وټاکئ.', intro: 'د آی‌ټي، انګلیسي او راتلونکو مسلکونو لپاره عملي پروګرامونه.', results: 'پایلې', it: 'د آی‌ټي کورسونه', english: 'د انګلیسي کورسونه', all: 'ټول کورسونه', search: 'کورسونه ولټوئ...', free: 'وړیا', view: 'کورس وګورئ →', empty: 'کورس ونه موندل شو', tryAgain: 'بله پلټنیزه کلمه وکاروئ.' }
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]); const [query, setQuery] = useState(''); const [category, setCategory] = useState('');
  const { language } = useLanguage(); const c = copy[language];
  useEffect(() => { const params = new URLSearchParams(window.location.search); setQuery(params.get('search') || ''); setCategory(params.get('category') || ''); fetch(`${api}/courses`).then(r => r.ok ? r.json() : []).then(setCourses).catch(() => setCourses([])); }, []);
  const filtered = useMemo(() => courses.filter(course => { const text = `${course.title} ${course.description} ${course.category}`.toLowerCase(); const categoryText = course.category.toLowerCase(); const categoryMatch = !category || (category === 'it' ? categoryText.includes('it') : categoryText.includes('english') || categoryText.includes('language')); return categoryMatch && text.includes(query.toLowerCase()); }), [courses, query, category]);
  return <main><SiteHeader /><section className="page-hero"><span className="eyebrow">Afghan IT Academy</span><h1>{c.title}</h1><p>{c.intro}</p></section><section className="catalog catalog-page"><div className="catalog-toolbar"><div><span className="section-kicker">{filtered.length} {c.results}</span><h2>{category === 'it' ? c.it : category === 'english' ? c.english : c.all}</h2></div><input aria-label={c.search} placeholder={c.search} value={query} onChange={e => setQuery(e.target.value)} /></div><div className="course-grid">{filtered.map(course => <article className="course" key={course.id}><div className="course-badge">{course.accessTier === 'free' ? c.free : 'PRO'}</div><small>{course.category} · {course.level}</small><h3>{course.title}</h3><p>{course.description}</p><Link href={`/courses/${course.id}`}>{c.view}</Link></article>)}</div>{!filtered.length && <div className="empty-state"><h3>{c.empty}</h3><p>{c.tryAgain}</p></div>}</section></main>;
}
