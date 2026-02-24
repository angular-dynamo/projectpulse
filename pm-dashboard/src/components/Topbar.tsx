import { Persona, Project } from '../types';
import { Bell, ChevronDown } from 'lucide-react';
import { WEEKS } from '../data/mockData';

interface TopbarProps {
    persona: Persona;
    setPersona: (p: Persona) => void;
    personaLabels: Record<Persona, string>;
    selectedWeek: string;
    setWeek: (w: string) => void;
    selectedProjectId: string;
    setProject: (id: string) => void;
    projects: Project[];
}

const PERSONA_COLORS: Record<Persona, string> = {
    tpm: 'linear-gradient(135deg,#6d6cff,#9b6cff)',
    director: 'linear-gradient(135deg,#059669,#10b981)',
    developer: 'linear-gradient(135deg,#0891b2,#22d3ee)',
};

export default function Topbar({ persona, setPersona, personaLabels, selectedWeek, setWeek, selectedProjectId, setProject, projects }: TopbarProps) {
    const project = projects.find(p => p.id === selectedProjectId);
    const pages: Record<Persona, string> = { tpm: 'TPM Command Center', director: 'Director Overview', developer: 'Developer Portal' };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div>
                    <div className="page-title">{pages[persona]}</div>
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

                {/* Persona Switcher */}
                <div className="persona-switcher">
                    {(['tpm', 'director', 'developer'] as Persona[]).map(p => (
                        <button key={p} className={`persona-btn ${persona === p ? 'active' : ''}`} onClick={() => setPersona(p)} style={persona === p ? { background: PERSONA_COLORS[p] } : {}}>
                            {personaLabels[p]}
                        </button>
                    ))}
                </div>

                {/* Avatar */}
                <div className="avatar" style={{ background: PERSONA_COLORS[persona] }}>
                    {persona === 'tpm' ? 'KS' : persona === 'director' ? 'DP' : 'RV'}
                </div>
            </div>
        </header>
    );
}
