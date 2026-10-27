import { Database, CheckCircle, AlertTriangle, Terminal, RefreshCw } from 'lucide-react';
import type { HealthStatus } from '../types';

interface DbSettingsProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const DbSettings: React.FC<DbSettingsProps> = ({
  health,
  onRefreshHealth,
  showToast
}) => {
  const isMysql = health?.engine === 'mysql' && health?.connected;

  const handleTest = async () => {
    await onRefreshHealth();
    showToast('Database connection tested', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Current Connection Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="brand-icon"
              style={{
                background: isMysql
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <h2>Database Connection Status</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Backend: Python FastAPI (SQLAlchemy 2.0 + PyMySQL)
              </p>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={handleTest}>
            <RefreshCw size={15} />
            <span>Test Connection</span>
          </button>
        </div>

        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: isMysql ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${isMysql ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {isMysql ? (
            <>
              <CheckCircle size={22} color="#10b981" />
              <div>
                <strong style={{ color: '#34d399' }}>Connected to Live MySQL Database</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Active URI: {health?.url || 'localhost:3306/tindamate_db'}
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={22} color="#f59e0b" />
              <div>
                <strong style={{ color: '#fbbf24' }}>Connected via Local SQLite Fallback</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  MySQL service on port 3306 is not detected. The app is running smoothly in zero-config development mode.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Database Config Table */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ background: 'rgba(10, 15, 26, 0.5)', padding: '0.85rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Database Engine</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
              {health?.engine.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>
          <div style={{ background: 'rgba(10, 15, 26, 0.5)', padding: '0.85rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Database</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
              tindamate_db
            </div>
          </div>
          <div style={{ background: 'rgba(10, 15, 26, 0.5)', padding: '0.85rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Default Host:Port</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
              localhost:3306
            </div>
          </div>
          <div style={{ background: 'rgba(10, 15, 26, 0.5)', padding: '0.85rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ORM Driver</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
              PyMySQL / SQLAlchemy 2.0
            </div>
          </div>
        </div>
      </div>

      {/* Guide Card: How to switch to MySQL */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Terminal size={20} color="#06b6d4" />
          <h3>How to Connect MySQL</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <div style={{ background: 'rgba(10, 15, 26, 0.6)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
            <strong style={{ color: '#fff' }}>Option A: Using XAMPP / WampServer (Recommended on Windows)</strong>
            <ol style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', lineHeight: '1.6' }}>
              <li>Open XAMPP Control Panel and click <strong>Start</strong> next to MySQL.</li>
              <li>Make sure <code>backend/.env</code> has <code>DB_USER=root</code> and <code>DB_PASSWORD=</code> (default for XAMPP).</li>
              <li>Run <code>python init_db.py</code> in the <code>backend/</code> folder to automatically create the database and tables!</li>
            </ol>
          </div>

          <div style={{ background: 'rgba(10, 15, 26, 0.6)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #06b6d4' }}>
            <strong style={{ color: '#fff' }}>Option B: Using Docker Compose</strong>
            <p style={{ marginTop: '0.35rem' }}>
              A <code>docker-compose.yml</code> file is included in the project root. Run:
            </p>
            <pre style={{ background: '#0b0f19', padding: '0.65rem 0.85rem', borderRadius: '6px', marginTop: '0.35rem', color: '#38bdf8', fontSize: '0.8rem' }}>
docker compose up -d
            </pre>
            <p style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
              This launches MySQL 8 on port 3306 and phpMyAdmin web GUI on <a href="http://localhost:8080" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>http://localhost:8080</a>.
            </p>
          </div>

          <div style={{ background: 'rgba(10, 15, 26, 0.6)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
            <strong style={{ color: '#fff' }}>Option C: Cloud MySQL (PlanetScale, AWS RDS, Aiven, Supabase)</strong>
            <p style={{ marginTop: '0.35rem' }}>
              Simply update <code>DATABASE_URL</code> in <code>backend/.env</code>:
            </p>
            <pre style={{ background: '#0b0f19', padding: '0.65rem 0.85rem', borderRadius: '6px', marginTop: '0.35rem', color: '#a78bfa', fontSize: '0.8rem' }}>
DATABASE_URL=mysql+pymysql://user:password@host:3306/dbname?ssl_verify_cert=true
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
