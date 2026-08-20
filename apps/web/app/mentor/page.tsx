'use client';

import { FormEvent, useState } from 'react';
import { SiteHeader } from '../../components/site-header';
import { useLanguage } from '../../lib/language';

const api = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const copy = {
  en: { required: 'Sign in before using AI Mentor.', unavailable: 'AI Mentor is currently unavailable.', server: 'Could not connect to the server.', eyebrow: 'Your 24/7 learning companion', title: 'Learn with AI Mentor.', intro: 'Explain code, find errors, practice English, or get guidance with your homework.', placeholder: 'Write your question...', busy: 'Preparing an answer…', ask: 'Ask a question →' },
  fa: { required: 'برای استفاده از مربی هوش مصنوعی وارد شوید.', unavailable: 'مربی هوش مصنوعی فعلاً در دسترس نیست.', server: 'ارتباط با سرور برقرار نشد.', eyebrow: 'همراه آموزشی شبانه‌روزی شما', title: 'با مربی هوش مصنوعی بیاموزید.', intro: 'کد را توضیح دهید، خطاها را پیدا کنید، انگلیسی تمرین کنید یا برای تکلیف خود راهنمایی بگیرید.', placeholder: 'پرسش خود را بنویسید...', busy: 'پاسخ آماده می‌شود…', ask: 'پرسش کنید →' },
  ps: { required: 'د AI لارښود د کارولو لپاره ننوځئ.', unavailable: 'AI لارښود اوس مهال نشته.', server: 'له سرور سره اړیکه ونه نیول شوه.', eyebrow: 'ستاسو ۲۴/۷ د زده‌کړې ملګری', title: 'له AI لارښود سره زده‌کړه وکړئ.', intro: 'کوډ تشریح کړئ، تېروتنې ومومئ، انګلیسي تمرین کړئ یا د کورنۍ دندې لپاره لارښوونه واخلئ.', placeholder: 'خپله پوښتنه ولیکئ...', busy: 'ځواب چمتو کېږي…', ask: 'پوښتنه وکړئ →' }
};

export default function MentorPage() {
  const [question, setQuestion] = useState(''); const [answer, setAnswer] = useState(''); const [busy, setBusy] = useState(false);
  const { language } = useLanguage(); const c = copy[language];
  async function ask(e: FormEvent) { e.preventDefault(); const token = sessionStorage.getItem('afghan-it.access-token'); if (!token) { setAnswer(c.required); return; } setBusy(true); try { const r = await fetch(`${api}/ai/mentor`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ message: question }) }); const data = await r.json().catch(() => ({})) as { answer?: string; message?: string }; setAnswer(data.answer || data.message || c.unavailable); } catch { setAnswer(c.server); } finally { setBusy(false); } }
  return <main><SiteHeader /><section className="mentor-page"><div className="mentor-orb">✦</div><span className="eyebrow">{c.eyebrow}</span><h1>{c.title}</h1><p>{c.intro}</p><form className="mentor-form" onSubmit={ask}><textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder={c.placeholder} required /><button className="primary-button" disabled={busy}>{busy ? c.busy : c.ask}</button></form>{answer && <article className="mentor-answer"><span>AI Mentor</span><p>{answer}</p></article>}</section></main>;
}
