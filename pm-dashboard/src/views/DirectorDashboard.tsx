import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useProjectKPIs } from '../hooks/useProjectKPIs';
import ConfluenceExporter from '../components/ConfluenceExporter';
import { CheckCircle, XCircle, BarChart3, AlertTriangle, Flag, Users } from 'lucide-react';
import { CURRENT_WEEK } from '../data/mockData';

function ProjectHealthCard({ projectId }: { projectId: string }) {
    const { state } = useDashboard();
    const kpi = useProjectKPIs(projectId, CURRENT_WEEK);
    const p = kpi.project;

    return (
        <div className={`card`} style={{ borderColor: p?.ragStatus === 'green' ? 'rgba(16,185,129,0.3)' : p?.ragStatus === 'amber' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)' }}>
            <div className="card-header">
                <div className="flex items-center gap-12">
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,var(--violet),var(--cyan))', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>
                        {p?.code}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p?.name}</div>
                        <div className="text-xs text-muted">{p?.description?.slice(0, 60)}…</div>
                    </div>
                </div>
                <span className={`rag-badge rag-${p?.ragStatus}`}>{p?.ragStatus?.toUpperCase()}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 8 }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><BarChart3 size={10} /> Velocity</div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--violet-light)' }}>{kpi.latestVelocity}</div>
                    <div className="text-xs text-muted">pts</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Flag size={10} /> Milestones</div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: kpi.milestones.delayed > 0 ? 'var(--amber)' : 'var(--emerald)' }}>{kpi.milestones.completed}/{kpi.milestones.total}</div>
                    <div className="text-xs text-muted">{kpi.milestones.delayed} delayed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><AlertTriangle size={10} /> Risks</div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: kpi.risks.critical > 0 ? 'var(--red)' : 'var(--emerald)' }}>{kpi.risks.open}</div>
                    <div className="text-xs text-muted">{kpi.risks.critical} critical</div>
                </div>
            </div>
            {/* Budget */}
            <div style={{ marginTop: 12 }}>
                <div className="flex justify-between text-xs text-muted" style={{ marginBottom: 4 }}>
                    <span>Budget Burn</span><span>{kpi.budgetBurn}%</span>
                </div>
                <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{
                        width: `${kpi.budgetBurn}%`,
                        background: kpi.budgetBurn > 80 ? 'linear-gradient(90deg,#dc2626,var(--red))' : kpi.budgetBurn > 65 ? 'linear-gradient(90deg,var(--amber),#fbbf24)' : 'linear-gradient(90deg,var(--emerald),var(--cyan))'
                    }} />
                </div>
            </div>
        </div>
    );
}

export default function DirectorDashboard() {
    const { state, dispatch } = useDashboard();
    const [activeView, setActiveView] = useState<'summary' | 'reports'>('summary');
    const [commentMap, setCommentMap] = useState<Record<string, string>>({});
    const [toastMsg, setToastMsg] = useState('');

    const pendingReports = state.weeklyReports.filter(r => r.status === 'submitted');
    const approvedReports = state.weeklyReports.filter(r => r.status === 'approved');

    function handleApprove(reportId: string) {
        const r = state.weeklyReports.find(x => x.id === reportId)!;
        dispatch({ type: 'UPDATE_REPORT', payload: { ...r, status: 'approved', approvedBy: 'David Park', approvalComment: '', updatedAt: new Date().toISOString() } });
        setToastMsg('Report approved! Confluence export is now available.');
        setTimeout(() => setToastMsg(''), 4000);
    }

    function handleReject(reportId: string) {
        const r = state.weeklyReports.find(x => x.id === reportId)!;
        dispatch({ type: 'UPDATE_REPORT', payload: { ...r, status: 'rejected', approvedBy: 'David Park', approvalComment: commentMap[reportId] ?? 'Please revise and resubmit.', updatedAt: new Date().toISOString() } });
        setToastMsg('Report rejected with feedback.');
        setTimeout(() => setToastMsg(''), 3000);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="section-label">Director View — Portfolio Intelligence</div>

            {/* Portfolio summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                    { label: 'Total Projects', value: state.projects.length, icon: <BarChart3 size={16} />, color: 'var(--violet-light)' },
                    { label: 'On Track', value: state.projects.filter(p => p.ragStatus === 'green').length, icon: <CheckCircle size={16} />, color: 'var(--emerald)' },
                    { label: 'At Risk', value: state.projects.filter(p => p.ragStatus === 'amber').length, icon: <AlertTriangle size={16} />, color: 'var(--amber)' },
                    { label: 'Delayed', value: state.projects.filter(p => p.ragStatus === 'red').length, icon: <XCircle size={16} />, color: 'var(--red)' },
                ].map(c => (
                    <div key={c.label} className="kpi-card" style={{ '--accent-color': c.color } as React.CSSProperties}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="kpi-label">{c.label}</div>
                            <div style={{ color: c.color }}>{c.icon}</div>
                        </div>
                        <div className="kpi-value" style={{ color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab-btn ${activeView === 'summary' ? 'active' : ''}`} onClick={() => setActiveView('summary')}>Portfolio Health</button>
                <button className={`tab-btn ${activeView === 'reports' ? 'active' : ''}`} onClick={() => setActiveView('reports')}>
                    Pending Reviews {pendingReports.length > 0 && <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{pendingReports.length}</span>}
                </button>
            </div>

            {activeView === 'summary' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
                        {state.projects.map(p => <ProjectHealthCard key={p.id} projectId={p.id} />)}
                    </div>
                    {/* Approved reports → Confluence export */}
                    {approvedReports.length > 0 && (
                        <div>
                            <div className="section-label" style={{ marginBottom: 12 }}>Confluence-Ready Reports</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {approvedReports.map(r => (
                                    <ConfluenceExporter key={r.id} report={r} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeView === 'reports' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {pendingReports.length === 0 && (
                        <div className="card empty-state">
                            <CheckCircle size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                            <div style={{ fontWeight: 600 }}>All caught up! No pending reports.</div>
                        </div>
                    )}
                    {pendingReports.map(r => {
                        const project = state.projects.find(p => p.id === r.projectId);
                        return (
                            <div key={r.id} className="card">
                                <div className="card-header">
                                    <div className="flex items-center gap-12">
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--violet),var(--cyan))', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>
                                            {project?.code}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{project?.name}</div>
                                            <div className="text-xs text-muted">Week: {r.week} • Prepared by: {r.preparedBy}</div>
                                        </div>
                                    </div>
                                    <span className={`rag-badge rag-${r.ragStatus}`}>{r.ragStatus.toUpperCase()}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8, marginBottom: 16 }}>
                                    {[
                                        { label: '✅ Accomplishments', text: r.accomplishments },
                                        { label: '📌 Next Week', text: r.nextWeekPlan },
                                        { label: '🚧 Blockers', text: r.blockers },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: 'var(--bg-glass)', borderRadius: 8, padding: 12 }}>
                                            <div className="form-label" style={{ marginBottom: 8 }}>{s.label}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{s.text}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <input className="form-input" style={{ flex: 1 }}
                                        placeholder="Leave a comment (optional for rejection)..."
                                        value={commentMap[r.id] ?? ''}
                                        onChange={e => setCommentMap(m => ({ ...m, [r.id]: e.target.value }))} />
                                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id)}>
                                        <CheckCircle size={14} /> Approve
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.id)}>
                                        <XCircle size={14} /> Reject
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Show approved ones for export */}
                    {approvedReports.length > 0 && (
                        <div>
                            <div className="section-label" style={{ margin: '8px 0' }}>Approved — Ready for Confluence</div>
                            {approvedReports.map(r => <ConfluenceExporter key={r.id} report={r} />)}
                        </div>
                    )}
                </div>
            )}

            {toastMsg && (
                <div className="toast success">
                    <CheckCircle size={16} color="var(--emerald)" /> {toastMsg}
                </div>
            )}
        </div>
    );
}
