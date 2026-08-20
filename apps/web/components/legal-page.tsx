'use client';

import { SiteHeader } from './site-header';
import { useLanguage } from '../lib/language';

const copy = {
  en: { privacy: ['Privacy policy', 'We collect only the account and learning data needed to provide courses, progress, certificates, and support. We do not sell personal data. Contact support@afghan-it.com for access or deletion requests.'], terms: ['Terms of use', 'Use the academy lawfully, keep your account secure, and do not copy or redistribute course content without permission. Paid access and certificate rules are shown before enrollment.'] },
  fa: { privacy: ['سیاست حفظ حریم خصوصی', 'ما تنها اطلاعات حساب و آموزش را برای ارائه دوره‌ها، پیشرفت، گواهی‌نامه و پشتیبانی جمع‌آوری می‌کنیم. اطلاعات شخصی فروخته نمی‌شود.'], terms: ['شرایط استفاده', 'از آکادمی به‌صورت قانونی استفاده کنید، حساب خود را امن نگه دارید و محتوای دوره را بدون اجازه بازنشر نکنید.'] },
  ps: { privacy: ['د محرمیت تګلاره', 'موږ یوازې د کورسونو، پرمختګ، سندونو او ملاتړ لپاره اړین حساب او زده‌کړیز معلومات راټولوو. شخصي معلومات نه پلورو.'], terms: ['د کارولو شرایط', 'اکاډمي په قانوني توګه وکاروئ، خپل حساب خوندي وساتئ او د اجازې پرته د کورس منځپانګه مه خپروئ.'] }
};

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { language } = useLanguage(); const [title, body] = copy[language][kind];
  return <main><SiteHeader /><section className="page-hero"><span className="eyebrow">Afghan IT Academy</span><h1>{title}</h1><p>{body}</p></section></main>;
}
