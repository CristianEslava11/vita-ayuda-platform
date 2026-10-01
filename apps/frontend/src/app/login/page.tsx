'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, AlertTriangleIcon, HeartPulseIcon, BellIcon, FileTextIcon } from '@/components/ui/icons';
import styles from './login.module.css';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;

    const roleName = (user.roleName || '').toUpperCase();
    if (roleName === 'ADMIN') {
      router.replace('/admin');
    } else if (roleName === 'DOCTOR') {
      router.replace('/dashboard/doctor');
    } else {
      router.replace('/dashboard/patient');
    }
  }, [isLoading, router, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* LEFT: Branding Panel */}
      <div className={styles.brandingPanel}>
        <div className={styles.brandingContent}>
          <div className={styles.logoIcon}>V</div>
          <h1 className={styles.brandingTitle}>Vita Ayuda</h1>
          <p className={styles.brandingSubtitle}>
            Plataforma integral de monitoreo y gestion de pacientes para tu IPS
          </p>

          <div className={styles.brandingFeatures}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>
                <HeartPulseIcon size={18} />
              </span>
              Registro diario de signos vitales
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>
                <BellIcon size={18} />
              </span>
              Seguimiento personal de salud
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>
                <FileTextIcon size={18} />
              </span>
              Historial de mediciones
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Form Panel */}
      <div className={styles.formPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Iniciar Sesion</h2>
              <p className={styles.formSubtitle}>
                Ingresa tus credenciales para acceder
              </p>
            </div>

            {error && (
              <div className={styles.errorAlert}>
                <span className={styles.errorIcon}>
                  <AlertTriangleIcon size={18} />
                </span>
                <span className={styles.errorText}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} id="login-form">
              <div className={styles.fieldGroup}>
                <label htmlFor="email" className={styles.label}>
                  Correo Electronico
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <MailIcon size={16} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    placeholder="paciente@vitaayuda.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="password" className={styles.label}>
                  Contrasena
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <LockIcon size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    placeholder="Ingresa tu contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.spinner} />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Iniciar Sesion</span>
                )}
              </button>
            </form>

            <div className={styles.divider}>Plataforma segura</div>

            <p className={styles.formFooter}>
              &iquest;Necesitas ayuda?{' '}
              Contacta al responsable de tu IPS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
