import type { Metadata } from 'next';
import './styles.css';
import Script from 'next/script';

export const metadata: Metadata = { title: 'Afghan IT Academy', description: 'Practical IT and English learning for Afghanistan.', manifest: '/manifest.webmanifest' };

export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}<Script id="service-worker">{'if (\'serviceWorker\' in navigator) navigator.serviceWorker.register(\'/sw.js\');'}</Script></body></html>; }
