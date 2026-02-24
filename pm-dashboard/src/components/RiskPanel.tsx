import { useDashboard } from '../context/DashboardContext';
import { RiskLevel } from '../types';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const RISK_ORDER: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function RiskBadge({ level }: { level: RiskLevel }) {
    return <span className={`status-pill risk-${level}`} style={{ fontSize: 10 }}>{level.toUpperCase()}</span>;
}

export default function RiskPanel() {
    const { state } = useDashboard();
    const risks = state.risks
        .filter(r => r.projectId === state.selectedProjectId)
        .sort((a, b) => (RISK_ORDER[b.impact] - RISK_ORDER[a.impact]) || (RISK_ORDER[b.probability] - RISK_ORDER[a.probability]));

    const open = risks.filter(r => r.status === 'open').length;
    const critical = risks.filter(r => r.impact === 'critical' && r.status === 'open').length;
    const mitigated = risks.filter(r => r.status === 'mitigated').length;
    const closed = risks.filter(r => r.status === 'closed').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-label">Risk Register</div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                    { label: 'Open Risks', value: open, color: 'var(--red)' },
                    { label: 'Critical', value: critical, color: '#ff4040' },
                    { label: 'Mitigated', value: mitigated, color: 'var(--amber)' },
                    { label: 'Closed', value: closed, color: 'var(--emerald)' },
                ].map(c => (
                    <div key={c.label} className="card" style={{ textAlign: 'center', padding: 16 }}>
                        <div className="kpi-label">{c.label}</div>
                        <div className="kpi-value" style={{ fontSize: 28, color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title"><AlertTriangle size={15} /> Risk Register — {state.projects.find(p => p.id === state.selectedProjectId)?.name}</div>
                    <div className="text-xs text-muted">{risks.length} total risks</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th><th>Risk Title</th><th>Probability</th><th>Impact</th>
                                <th>Status</th><th>Owner</th><th>Mitigation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {risks.map(r => {
                                const owner = state.teamMembers.find(m => m.id === r.ownerId);
                                return (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 700, color: 'var(--violet-light)', fontFamily: 'monospace' }}>{r.id}</td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{r.title}</div>
                                            <div className="text-xs text-muted" style={{ marginTop: 2, maxWidth: 200 }}>{r.description}</div>
                                        </td>
                                        <td><RiskBadge level={r.probability} /></td>
                                        <td><RiskBadge level={r.impact} /></td>
                                        <td>
                                            <span className={`status-pill ${r.status === 'open' ? 'pill-blocked' : r.status === 'mitigated' ? 'pill-inprogress' : 'pill-done'}`}>
                                                {r.status === 'open' ? '🔴' : r.status === 'mitigated' ? '🟡' : '🟢'} {r.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-8">
                                                <div className="avatar" style={{ background: 'var(--violet-dim)', color: 'var(--violet-light)', width: 24, height: 24, fontSize: 9 }}>
                                                    {owner?.avatar}
                                                </div>
                                                <span style={{ fontSize: 12 }}>{owner?.name.split(' ')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="text-xs text-secondary" style={{ maxWidth: 200 }}>{r.mitigation}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
