import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = { title: 'Afghan IT Academy', description: 'Practical IT and English learning for Afghanistan.' };

export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
