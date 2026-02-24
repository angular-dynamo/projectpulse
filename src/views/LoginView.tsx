import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldCheck, Code, PieChart, LayoutDashboard, Database } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:3001/api';

export default function LoginView() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDemo, setShowDemo] = useState(false);
    const [useMockData, setUseMockData] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Seed DB with mock data only if toggle is ON
            if (useMockData) {
                await fetch(`${API_BASE}/seed`, { method: 'POST' }).catch(() => null);
            }
            await login(email);
        } catch (err: any) {
            setError(err.message || 'Login failed');
            setLoading(false);
        }
    };

    const demoLogin = (demoEmail: string) => {
        setEmail(demoEmail);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-base)',
            padding: 20
        }}>
            <div className="card" style={{ maxWidth: 440, width: '100%', padding: '40px 30px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 64, height: 64, margin: '0 auto 16px', borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
                        display: 'grid', placeItems: 'center', color: '#fff'
                    }}>
                        <LayoutDashboard size={32} />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                        ProjectPulse 360
                    </h1>
                    <p className="text-muted">Sign in to access your workspace</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="name@acme.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Mock Data Toggle */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 10,
                        background: useMockData ? 'rgba(109,108,255,0.08)' : 'var(--bg-glass)',
                        border: `1px solid ${useMockData ? 'var(--violet)' : 'var(--border)'}`,
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                    }} onClick={() => setUseMockData(v => !v)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Database size={16} color={useMockData ? 'var(--violet)' : 'var(--text-muted)'} />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: useMockData ? 'var(--violet)' : 'var(--text-primary)' }}>
                                    Load Mock Data
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    Seed database with sample projects & stories
                                </div>
                            </div>
                        </div>
                        {/* Toggle switch */}
                        <div style={{
                            width: 40, height: 22, borderRadius: 11, position: 'relative',
                            background: useMockData ? 'var(--violet)' : 'var(--border)',
                            transition: 'background 0.2s', flexShrink: 0,
                        }}>
                            <div style={{
                                position: 'absolute', top: 3, left: useMockData ? 21 : 3,
                                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            }} />
                        </div>
                    </div>

                    {useMockData && (
                        <div style={{ fontSize: 12, color: 'var(--violet)', display: 'flex', alignItems: 'center', gap: 6, marginTop: -8 }}>
                            ℹ️ Mock data will be inserted only if the database is currently empty.
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: 'var(--red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShieldCheck size={16} /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: 15 }}
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : <><LogIn size={18} /> Sign In</>}
                    </button>
                </form>

                <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center', marginBottom: showDemo ? 16 : 0 }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDemo(!showDemo)} style={{ margin: '0 auto', fontSize: 12 }}>
                            Demo Login {showDemo ? '▲' : '▼'}
                        </button>
                    </div>
                    {showDemo && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => demoLogin('david@acme.com')} style={{ justifyContent: 'center' }}>
                                <PieChart size={14} /> Director
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => demoLogin('kavita@acme.com')} style={{ justifyContent: 'center' }}>
                                <LayoutDashboard size={14} /> TPM
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => demoLogin('rahul@acme.com')} style={{ justifyContent: 'center' }}>
                                <Code size={14} /> Developer
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => demoLogin('priya@acme.com')} style={{ justifyContent: 'center' }}>
                                <ShieldCheck size={14} /> Admin
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
