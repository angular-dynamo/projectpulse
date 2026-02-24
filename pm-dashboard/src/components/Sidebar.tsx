import { Persona } from '../types';
import { LayoutDashboard, BarChart3, Calendar, Users, AlertTriangle, FileText, Activity } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (t: string) => void;
    persona: Persona;
}

const TPM_TABS = [
    { id: 'kpi', label: 'KPI Overview', icon: LayoutDashboard },
    { id: 'weekly', label: 'Weekly Status', icon: Activity },
    { id: 'tasks', label: 'Task Progress', icon: BarChart3 },
    { id: 'capacity', label: 'Capacity', icon: Users },
    { id: 'milestones', label: 'Milestones', icon: Calendar },
    { id: 'risks', label: 'Risks', icon: AlertTriangle },
];

const DIRECTOR_TABS = [
    { id: 'kpi', label: 'Executive Summary', icon: LayoutDashboard },
    { id: 'weekly', label: 'Weekly Reports', icon: FileText },
];

const DEV_TABS = [
    { id: 'kpi', label: 'My Tasks', icon: LayoutDashboard },
    { id: 'add', label: 'Add Stories', icon: FileText },
    { id: 'import', label: 'Excel Import', icon: BarChart3 },
];

const TABS_BY_PERSONA: Record<Persona, typeof TPM_TABS> = {
    tpm: TPM_TABS,
    director: DIRECTOR_TABS,
    developer: DEV_TABS,
};

const PERSONA_ICONS: Record<Persona, string> = { tpm: '🎯', director: '📊', developer: '💻' };

export default function Sidebar({ activeTab, setActiveTab, persona }: SidebarProps) {
    const tabs = TABS_BY_PERSONA[persona];
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">PM</div>
                <div>
                    <div className="logo-text">ProjectPulse</div>
                    <div className="logo-sub">360° PM Dashboard</div>
                </div>
            </div>
            <nav className="sidebar-nav">
                <div className="nav-section-label">{PERSONA_ICONS[persona]} {persona.toUpperCase()} View</div>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            <Icon className="nav-icon" size={15} />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
            <div className="sidebar-footer">
                <div className="text-xs text-muted">Week: Feb 2026 • Sprint 4</div>
            </div>
        </aside>
    );
}
