'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  HomeIcon,
  HeartPulseIcon,
  ClipboardListIcon,
  FileTextIcon,
  CalendarIcon,
  BellIcon,
  UsersIcon,
  ActivityIcon,
  AlertTriangleIcon,
  SettingsIcon,
  LogoutIcon,
  MenuIcon,
  MessageCircleIcon,
} from '@/components/ui/icons';
import styles from './dashboard.module.css';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const patientNav: NavSection[] = [
  { section: 'Principal', items: [
    { label: 'Dashboard', icon: HomeIcon, href: '/dashboard/patient' },
    { label: 'Mis Signos Vitales', icon: HeartPulseIcon, href: '/dashboard/patient/vitals' },
    { label: 'Monitoreo Diario', icon: ClipboardListIcon, href: '/dashboard/patient/monitoring' },
  ]},
  { section: 'Mi Salud', items: [{ label: 'Mi Perfil', icon: UsersIcon, href: '/dashboard/patient/profile' }] },
];

const doctorNav: NavSection[] = [
  {
    section: 'Principal',
    items: [
      { label: 'Dashboard', icon: HomeIcon, href: '/dashboard/doctor' },
      { label: 'Mis Pacientes', icon: UsersIcon, href: '/dashboard/doctor/patients' },
      { label: 'Monitoreo', icon: ActivityIcon, href: '/dashboard/doctor/monitoring' },
      { label: 'Seguimiento', icon: MessageCircleIcon, href: '/dashboard/doctor/follow-up' },
    ],
  },
  {
    section: 'Gestion',
    items: [
      { label: 'Citas del Dia', icon: CalendarIcon, href: '/dashboard/doctor/appointments' },
      { label: 'Alertas Activas', icon: AlertTriangleIcon, href: '/dashboard/doctor/alerts' },
      { label: 'Reglas Clinicas', icon: SettingsIcon, href: '/dashboard/doctor/rules' },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const role = (user.roleName ?? '').toUpperCase();
    if (role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Cargando Vita Ayuda...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Redirigiendo al login...</p>
      </div>
    );
  }

  const role = (user.roleName ?? '').toLowerCase();
  const isDoctor = role === 'doctor';
  const navSections = isDoctor ? doctorNav : patientNav;
  const roleLabel = isDoctor ? 'Doctor' : 'Paciente';

  // Dynamically map navigation sections to inject the dynamic badge
  const mappedNavSections = navSections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.href === '/dashboard/patient/alerts' || item.href === '/dashboard/doctor/alerts') {
        return {
          ...item,
          badge: unreadCount > 0 ? String(unreadCount) : undefined,
        };
      }
      return item;
    }),
  }));
  const initials =
    (user.fullName || '')
      .split(' ')
      .map((name) => name[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '??';

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className={styles.layoutWrapper}>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarLogo}>+</div>
          <div>
            <div className={styles.sidebarBrandName}>Vita Ayuda</div>
            <div className={styles.sidebarBrandSub}>IPS &bull; {roleLabel}</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {mappedNavSections.map((section) => (
            <div key={section.section} className={styles.navSection}>
              <div className={styles.navSectionTitle}>{section.section}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${
                      pathname === item.href ? styles.navLinkActive : ''
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className={styles.navLinkIcon}>
                      <Icon size={18} className={styles.navLinkIcon} />
                    </span>
                    {item.label}
                    {item.badge && (
                      <span className={styles.navBadge}>{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.fullName}</div>
              <div className={styles.userRole}>{roleLabel}</div>
            </div>
            <button
              className={styles.logoutButton}
              onClick={logout}
              title="Cerrar sesion"
              aria-label="Cerrar sesion"
            >
              <LogoutIcon size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <MenuIcon size={20} color="var(--slate-500)" />
            </button>
            <span className={styles.headerGreeting}>
              {getGreeting()}, <strong>{(user.fullName || '').split(' ')[0]}</strong>
            </span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.headerDate}>{today}</span>
          </div>
        </header>

        <div className={styles.pageContent}>{children}</div>
      </main>
    </div>
  );
}
