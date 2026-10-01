import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';
export const metadata: Metadata = { title: 'Vita Ayuda | IPS — Plataforma de Monitoreo', description: 'Plataforma de seguimiento y monitoreo de pacientes.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><AuthProvider>{children}</AuthProvider></body></html>;
}
