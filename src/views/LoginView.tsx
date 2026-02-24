import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldCheck, Code, PieChart, LayoutDashboard } from 'lucide-react';

export default function LoginView() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDemo, setShowDemo] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
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
