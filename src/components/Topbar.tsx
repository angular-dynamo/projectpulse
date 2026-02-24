import type { Persona, Project } from '../types/index';
import { useAuth } from '../context/AuthContext';
import { Bell, ChevronDown, Sun, Moon, LogOut, Settings, Users } from 'lucide-react';
import { WEEKS } from '../data/mockData';

interface TopbarProps {
    persona: Persona;
    selectedWeek: string;
    setWeek: (w: string) => void;
    selectedProjectId: string;
    setProject: (id: string) => void;
    projects: Project[];
    theme: 'light' | 'dark';
    dispatch: React.Dispatch<any>;
    setActiveTab: (t: string) => void;
}

const PERSONA_COLORS: Record<Persona, string> = {
    tpm: 'linear-gradient(135deg,#6d6cff,#9b6cff)',
    director: 'linear-gradient(135deg,#059669,#10b981)',
    developer: 'linear-gradient(135deg,#0891b2,#22d3ee)',
};

export default function Topbar({ persona, selectedWeek, setWeek, selectedProjectId, setProject, projects, theme, dispatch, setActiveTab }: TopbarProps) {
    const { user, logout } = useAuth();
    const project = projects.find(p => p.id === selectedProjectId);
    const pages: Record<string, string> = { tpm: 'TPM Command Center', director: 'Director Overview', developer: 'Developer Portal', admin: 'Admin Console' };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div>
                    <div className="page-title">{pages[user?.appRole || persona]}</div>
                    {project && <div className="page-subtitle">📁 {project.name} ({project.code})</div>}
                </div>
            </div>
            <div className="topbar-right">
                {/* Project selector */}
                <div className="week-selector">
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Project</span>
                    <select value={selectedProjectId} onChange={e => setProject(e.target.value)}>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
                    </select>
                    <ChevronDown size={12} />
                </div>

                {/* Week selector */}
                <div className="week-selector">
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Week</span>
                    <select value={selectedWeek} onChange={e => setWeek(e.target.value)}>
                        {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <ChevronDown size={12} />
                </div>

                <div style={{ position: 'relative' }}>
                    <button className="btn btn-secondary btn-sm" style={{ borderRadius: '50%', width: 34, height: 34, padding: 0, display: 'grid', placeItems: 'center' }}>
                        <Bell size={14} />
                    </button>
                    <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: 'var(--red)', borderRadius: '50%', border: '2px solid var(--bg-surface)' }} />
                </div>

                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                    style={{ borderRadius: '50%', width: 34, height: 34, padding: 0, display: 'grid', placeItems: 'center' }}
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                {/* User Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16, paddingLeft: 16, borderLeft: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.appRole}</div>
                    </div>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg,var(--violet),var(--cyan))' }}>
                        {user?.avatar || 'U'}
                    </div>
                    {user?.appRole === 'admin' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('roles')} style={{ padding: '6px' }} title="User Roles">
                            <Users size={14} />
                        </button>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('settings')} style={{ padding: '6px' }} title="Settings">
                        <Settings size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={logout} style={{ padding: '6px' }} title="Logout">
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </header>
    );
}
