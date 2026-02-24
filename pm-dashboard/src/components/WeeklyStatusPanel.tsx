import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { WeeklyReport, RAGStatus } from '../types';
import { Save, CheckCircle } from 'lucide-react';
import { WEEKS } from '../data/mockData';

const RAG_OPTS: { value: RAGStatus; label: string; color: string }[] = [
    { value: 'green', label: '🟢 Green — On Track', color: 'var(--emerald)' },
    { value: 'amber', label: '🟡 Amber — At Risk', color: 'var(--amber)' },
    { value: 'red', label: '🔴 Red — Delayed', color: 'var(--red)' },
];

export default function WeeklyStatusPanel() {
    const { state, dispatch } = useDashboard();
    const [toastMsg, setToastMsg] = useState('');

    // Find existing report for current project/week
    const report = state.weeklyReports.find(
        r => r.projectId === state.selectedProjectId && r.week === state.selectedWeek
    );

    const isApproved = report?.status === 'approved';
    const project = state.projects.find(p => p.id === state.selectedProjectId);

    const [form, setForm] = useState({
        ragStatus: (report?.ragStatus ?? 'green') as RAGStatus,
        accomplishments: report?.accomplishments ?? '',
        nextWeekPlan: report?.nextWeekPlan ?? '',
        blockers: report?.blockers ?? '',
    });

    function handleSave() {
        if (report) {
            dispatch({ type: 'UPDATE_REPORT', payload: { ...report, ...form, updatedAt: new Date().toISOString(), status: 'submitted' } });
        } else {
            const newReport: WeeklyReport = {
                id: `wr-${Date.now()}`,
                projectId: state.selectedProjectId,
                week: state.selectedWeek,
                ...form,
                preparedBy: 'Kavita Singh',
                status: 'submitted',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            dispatch({ type: 'ADD_REPORT', payload: newReport });
        }
        setToastMsg('Weekly status report submitted for Director review ✓');
        setTimeout(() => setToastMsg(''), 3000);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-label">Weekly Status Report</div>

            {/* Project header */}
            <div className="card gradient-card" style={{ padding: 20 }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,var(--violet),var(--cyan))', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16 }}>
                            {project?.code}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{project?.name}</div>
                            <div className="text-sm text-muted">Week: {state.selectedWeek} • Report ID: {report?.id ?? 'New'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-12">
                        <span className={`rag-badge rag-${form.ragStatus}`}>
                            {form.ragStatus === 'green' ? '🟢' : form.ragStatus === 'amber' ? '🟡' : '🔴'} {form.ragStatus.toUpperCase()}
                        </span>
                        {isApproved && (
                            <span className="flex items-center gap-4" style={{ color: 'var(--emerald)', fontWeight: 600, fontSize: 13 }}>
                                <CheckCircle size={16} /> Approved by {report?.approvedBy}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Left — form */}
                <div className="card chart-full">
                    <div className="card-header">
                        <div className="card-title">📝 Weekly Update Form</div>
                        <div className="text-xs text-muted">{isApproved ? 'Read-only — Report approved' : 'Editable — Draft mode'}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* RAG */}
                        <div className="form-group">
                            <label className="form-label">RAG Status</label>
                            <select className="form-select" value={form.ragStatus} disabled={isApproved}
                                onChange={e => setForm(f => ({ ...f, ragStatus: e.target.value as RAGStatus }))}>
                                {RAG_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        {/* Accomplishments */}
                        <div className="form-group">
                            <label className="form-label">✅ Accomplishments This Week</label>
                            <textarea className="form-textarea" rows={5}
                                value={form.accomplishments} disabled={isApproved}
                                placeholder="• Story completed&#10;• Feature shipped&#10;• Bug resolved"
                                onChange={e => setForm(f => ({ ...f, accomplishments: e.target.value }))} />
                        </div>

                        {/* Next week plan */}
                        <div className="form-group">
                            <label className="form-label">📌 Next Week Plan</label>
                            <textarea className="form-textarea" rows={4}
                                value={form.nextWeekPlan} disabled={isApproved}
                                placeholder="• Sprint 5 planning&#10;• Design review&#10;• Code review sessions"
                                onChange={e => setForm(f => ({ ...f, nextWeekPlan: e.target.value }))} />
                        </div>

                        {/* Blockers */}
                        <div className="form-group">
                            <label className="form-label">🚧 Blockers & Risks</label>
                            <textarea className="form-textarea" rows={3}
                                value={form.blockers} disabled={isApproved}
                                placeholder="• Describe any impediments...&#10;• Escalations needed"
                                onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))} />
                        </div>

                        {!isApproved && (
                            <div className="flex gap-12">
                                <button className="btn btn-primary" onClick={handleSave}>
                                    <Save size={14} /> Submit Report
                                </button>
                                {report?.status === 'rejected' && (
                                    <span style={{ color: 'var(--red)', fontSize: 12, alignSelf: 'center' }}>
                                        ⚠ Rejected: {report.approvalComment}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Project status history */}
                <div className="card chart-full">
                    <div className="card-header">
                        <div className="card-title">📋 Report History</div>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr><th>Week</th><th>RAG</th><th>Status</th><th>Prepared By</th><th>Updated</th></tr>
                        </thead>
                        <tbody>
                            {state.weeklyReports
                                .filter(r => r.projectId === state.selectedProjectId)
                                .map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600 }}>{r.week}</td>
                                        <td><span className={`rag-badge rag-${r.ragStatus}`}>{r.ragStatus}</span></td>
                                        <td>
                                            <span className={`status-pill ${r.status === 'approved' ? 'pill-done' : r.status === 'rejected' ? 'pill-blocked' : 'pill-inprogress'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td>{r.preparedBy}</td>
                                        <td className="text-xs text-muted">{r.updatedAt.slice(0, 10)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {toastMsg && (
                <div className="toast success">
                    <CheckCircle size={16} color="var(--emerald)" />
                    {toastMsg}
                </div>
            )}
        </div>
    );
}
