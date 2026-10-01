'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SystemStatus } from '@vita-ayuda/shared';
import { getSystemStatus } from '@/services/api';

type Connection = 'loading' | 'connected' | 'error';
export function ServiceStatus() {
  const [connection, setConnection] = useState<Connection>('loading');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const check = useCallback(async (signal?: AbortSignal) => {
    setConnection('loading');
    try {
      const result = await getSystemStatus(signal);
      if (!signal?.aborted) {
        setStatus(result);
        setConnection('connected');
      }
    } catch {
      if (!signal?.aborted) {
        setStatus(null);
        setConnection('error');
      }
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void check(controller.signal);
    return () => controller.abort();
  }, [check]);
  return (
    <section className="service-card" aria-labelledby="service-title">
      <div className="section-heading">
        <div><span className="eyebrow">CONEXIÓN</span><h2 id="service-title">Estado del servicio</h2></div>
        <span className={`badge ${connection === 'connected' ? 'success' : ''}`}>
          {connection === 'connected' ? 'Disponible' : connection === 'loading' ? 'Comprobando' : 'Sin conexión'}
        </span>
      </div>
      <div className="connection-row" role="status" aria-live="polite">
        <span className={`status-dot ${connection}`} />
        <div>
          <strong>{connection === 'connected' ? 'Conexión establecida' : connection === 'loading' ? 'Consultando el servicio…' : 'No se pudo contactar con el servicio'}</strong>
          <p>{connection === 'connected' ? 'La aplicación está comunicándose con el servidor.' : connection === 'loading' ? 'La comprobación tomará unos instantes.' : 'Comprueba que el servidor esté iniciado y vuelve a intentar.'}</p>
        </div>
      </div>
      <div className="service-footer">
        <span>{status?.database === 'configured' ? 'Base de datos: configuración registrada; conexión por verificar.' : 'Base de datos: pendiente de configuración.'}</span>
        <button type="button" onClick={() => void check()} disabled={connection === 'loading'}>Comprobar conexión <span aria-hidden="true">↗</span></button>
      </div>
    </section>
  );
}
