import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildPageMetadata } from '@/lib/seo';
import { AfghanAcademyHome } from '@/components/public/afghan-academy-home';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return buildPageMetadata({ title: t('home.title'), description: t('defaultDescription'), path: '/', locale });
}

export default function LandingPage() {
  return <AfghanAcademyHome />;
}
