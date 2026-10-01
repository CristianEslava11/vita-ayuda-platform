'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, type MeResponse } from '@/services/auth.service';
interface AuthContextType { user: MeResponse | null; isLoading: boolean; login(email: string, password: string): Promise<void>; logout(): Promise<void>; }
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    authService.getMe().then(me => { if (active) setUser(me); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    router.replace('/dashboard/patient');
  }, [router]);
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    router.replace('/login');
    router.refresh();
  }, [router]);
  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider no disponible.');
  return context;
}
