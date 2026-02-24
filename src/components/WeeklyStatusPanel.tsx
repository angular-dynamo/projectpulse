import { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import type { WeeklyReport, RAGStatus } from '../types/index';
import { Save, CheckCircle, Wand2, RefreshCw, Edit, FileText } from 'lucide-react';

const RAG_OPTS: { value: RAGStatus; label: string; color: string }[] = [
    { value: 'green', label: '🟢 Green — On Track', color: 'var(--emerald)' },
    { value: 'amber', label: '🟡 Amber — At Risk', color: 'var(--amber)' },
    { value: 'red', label: '🔴 Red — Delayed', color: 'var(--red)' },
];

const API_BASE = 'http://127.0.0.1:3001/api';

export default function WeeklyStatusPanel() {
    const { state, dispatch } = useDashboard();
    const [toastMsg, setToastMsg] = useState('');

    // Find existing report for current project/week
    const report = state.weeklyReports.find(
        r => r.projectId === state.selectedProjectId && r.week === state.selectedWeek
    );

    const isApproved = report?.status === 'approved';
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    const isKanban = project?.projectType === 'kanban';
    const isAzure = project?.projectType === 'azure_boards';

    const [form, setForm] = useState({
        ragStatus: (report?.ragStatus ?? 'green') as RAGStatus,
        accomplishments: report?.accomplishments ?? '',
        nextWeekPlan: report?.nextWeekPlan ?? '',
        risksMitigation: report?.risksMitigation ?? '',
        blockers: report?.blockers ?? '',
    });

    useEffect(() => {
        setForm({
            ragStatus: (report?.ragStatus ?? 'green') as RAGStatus,
            accomplishments: report?.accomplishments ?? '',
            nextWeekPlan: report?.nextWeekPlan ?? '',
            risksMitigation: report?.risksMitigation ?? '',
            blockers: report?.blockers ?? '',
        });
    }, [report]);

    const [colFilters, setColFilters] = useState({
        week: '',
        ragStatus: '',
        status: '',
        preparedBy: '',
        updatedAt: ''
    });

    const [isGenerating, setIsGenerating] = useState(false);

    // ─── Auto-Fill from Stories grouped by Week ───────────────────────────────
    const weekStories = state.jiraStories.filter(
        s => s.projectId === state.selectedProjectId && s.week === state.selectedWeek
    );

    function handleAutoFillFromStories() {
        if (!weekStories.length) {
            setToastMsg('⚠️ No stories found for the selected week.');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }

        const doneStories = weekStories.filter(s => s.status === 'done');
        const inProgressStories = weekStories.filter(s => s.status === 'inprogress');
        const blockedStories = weekStories.filter(s => s.status === 'blocked');
        const todoStories = weekStories.filter(s => s.status === 'todo');

        const accomplishments = [
            ...doneStories.map(s => `• [${s.id}] ${s.title} — Done (${s.storyPoints} pts)${s.description ? `\n  ${s.description}` : ''}${s.acceptanceCriteria ? `\n  Acceptance: ${s.acceptanceCriteria}` : ''}`),
            ...inProgressStories.map(s => `• [${s.id}] ${s.title} — In Progress (${s.storyPoints} pts)${s.description ? `\n  ${s.description}` : ''}`),
        ].join('\n');

        const nextWeekPlan = [
            ...todoStories.map(s => `• [${s.id}] ${s.title} — To Do (${s.storyPoints} pts)${s.description ? `\n  ${s.description}` : ''}`),
        ].join('\n') || 'No pending stories found.'

        const allRisks = weekStories
            .filter(s => s.risksMitigation)
            .map(s => `• [${s.id}] ${s.risksMitigation}`).join('\n');

        const allBlockers = [
            ...blockedStories.map(s => `• [${s.id}] ${s.title} — Blocked`),
            ...weekStories.filter(s => s.blockers).map(s => `• [${s.id}] ${s.blockers}`)
        ].join('\n');

        setForm(f => ({
            ...f,
            accomplishments: accomplishments || f.accomplishments,
            nextWeekPlan: nextWeekPlan || f.nextWeekPlan,
            risksMitigation: allRisks || f.risksMitigation,
            blockers: allBlockers || f.blockers,
        }));

        setToastMsg(`✅ Auto-filled from ${weekStories.length} stories for ${state.selectedWeek}`);
        setTimeout(() => setToastMsg(''), 3000);
    }

    const filteredReports = state.weeklyReports
        .filter(r => r.projectId === state.selectedProjectId)
        .filter(r => {
            if (colFilters.week && !r.week.toLowerCase().includes(colFilters.week.toLowerCase())) return false;
            if (colFilters.ragStatus && !r.ragStatus.toLowerCase().includes(colFilters.ragStatus.toLowerCase())) return false;
            if (colFilters.status && !r.status.toLowerCase().includes(colFilters.status.toLowerCase())) return false;
            if (colFilters.preparedBy && !r.preparedBy.toLowerCase().includes(colFilters.preparedBy.toLowerCase())) return false;
            if (colFilters.updatedAt && !(r.updatedAt || '').toLowerCase().includes(colFilters.updatedAt.toLowerCase())) return false;
            return true;
        });

    async function handleGenerateAI() {
        setIsGenerating(true);
        setToastMsg('');
        try {
            const res = await fetch(`${API_BASE}/ai/summarize-weekly`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: state.selectedProjectId, week: state.selectedWeek })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate summary');
            }
            const data = await res.json();
            setForm(f => ({
                ...f,
                accomplishments: data.accomplishments || f.accomplishments,
                nextWeekPlan: data.nextWeekPlan || f.nextWeekPlan,
                risksMitigation: data.risksMitigation || f.risksMitigation,
                blockers: data.blockers || f.blockers
            }));
            setToastMsg('AI Summary Generated Successfully ✨');
            setTimeout(() => setToastMsg(''), 3000);
        } catch (error: any) {
            setToastMsg(`⚠️ ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleSave() {
        let updatedReport: WeeklyReport;
        if (report) {
            updatedReport = { ...report, ...form, updatedAt: new Date().toISOString(), status: 'submitted' };
        } else {
            updatedReport = {
                id: `wr-${Date.now()}`,
                projectId: state.selectedProjectId,
                week: state.selectedWeek,
                ...form,
                preparedBy: 'Kavita Singh',
                status: 'submitted',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }

        try {
            await fetch(`${API_BASE}/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedReport),
            });
            if (report) {
                dispatch({ type: 'UPDATE_REPORT', payload: updatedReport });
            } else {
                dispatch({ type: 'ADD_REPORT', payload: updatedReport });
            }
            setToastMsg('Weekly status report submitted for Director review ✓');
            setTimeout(() => setToastMsg(''), 3000);
        } catch {
            setToastMsg('⚠️ Failed to sync report with server');
        }
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
                {/* Project status history */}
                <div className="card chart-full">
                    <div className="card-header">
                        <div className="card-title">📋 Report History</div>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Week</th>
                                <th>RAG</th>
                                <th>Status</th>
                                <th>Prepared By</th>
                                <th>Updated</th>
                                <th>Action</th>
                            </tr>
                            <tr className="filter-row" style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '8px 16px' }}>
                                    <input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..."
                                        value={colFilters.week} onChange={e => setColFilters(f => ({ ...f, week: e.target.value }))} />
                                </th>
                                <th style={{ padding: '8px 16px' }}>
                                    <input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..."
                                        value={colFilters.ragStatus} onChange={e => setColFilters(f => ({ ...f, ragStatus: e.target.value }))} />
                                </th>
                                <th style={{ padding: '8px 16px' }}>
                                    <input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..."
                                        value={colFilters.status} onChange={e => setColFilters(f => ({ ...f, status: e.target.value }))} />
                                </th>
                                <th style={{ padding: '8px 16px' }}>
                                    <input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..."
                                        value={colFilters.preparedBy} onChange={e => setColFilters(f => ({ ...f, preparedBy: e.target.value }))} />
                                </th>
                                <th style={{ padding: '8px 16px' }}>
                                    <input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..."
                                        value={colFilters.updatedAt} onChange={e => setColFilters(f => ({ ...f, updatedAt: e.target.value }))} />
                                </th>
                                <th style={{ padding: '8px 16px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600 }}>{r.week}</td>
                                    <td><span className={`rag-badge rag-${r.ragStatus}`}>{r.ragStatus}</span></td>
                                    <td>
                                        <span className={`status-pill ${r.status === 'approved' ? 'pill-done' : r.status === 'rejected' ? 'pill-blocked' : 'pill-inprogress'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td>{r.preparedBy}</td>
                                    <td className="text-xs text-muted">{r.updatedAt?.slice(0, 10) || ''}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, opacity: r.status === 'approved' ? 0.5 : 1 }}
                                            disabled={r.status === 'approved'}
                                            title={r.status === 'approved' ? 'Approved reports cannot be updated' : ''}
                                            onClick={() => {
                                                dispatch({ type: 'SET_DATA', payload: { selectedWeek: r.week } });
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                setToastMsg(`Loaded report for ${r.week}`);
                                                setTimeout(() => setToastMsg(''), 3000);
                                            }}
                                        >
                                            <Edit size={12} /> Update
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
                            <label className="form-label">✅ {isAzure ? 'Completed Work Items' : isKanban ? 'Cards Delivered' : 'Accomplishments This Week'}</label>
                            <textarea className="form-textarea" rows={5}
                                value={form.accomplishments} disabled={isApproved}
                                placeholder={isAzure ? '• PBI completed\n• Bug fixed' : '• Story completed\n• Feature shipped\n• Bug resolved'}
                                onChange={e => setForm(f => ({ ...f, accomplishments: e.target.value }))} />
                        </div>

                        {/* Next week plan */}
                        <div className="form-group">
                            <label className="form-label">📌 {isAzure ? 'Next Iteration Plan' : isKanban ? 'Up Next in Queue' : 'Next Week Plan'}</label>
                            <textarea className="form-textarea" rows={4}
                                value={form.nextWeekPlan} disabled={isApproved}
                                placeholder={isAzure ? '• Iteration planning\n• Code reviews' : '• Sprint planning\n• Design review'}
                                onChange={e => setForm(f => ({ ...f, nextWeekPlan: e.target.value }))} />
                        </div>

                        {/* Risks & Mitigation */}
                        <div className="form-group">
                            <label className="form-label">⚠️ Risks & Mitigation</label>
                            <textarea className="form-textarea" rows={3}
                                value={form.risksMitigation} disabled={isApproved}
                                placeholder="• Risk: [Description] -> Mitigation: [Action]"
                                onChange={e => setForm(f => ({ ...f, risksMitigation: e.target.value }))} />
                        </div>

                        {/* Blockers */}
                        <div className="form-group">
                            <label className="form-label">🚧 Blockers</label>
                            <textarea className="form-textarea" rows={3}
                                value={form.blockers} disabled={isApproved}
                                placeholder="• Describe any impediments...&#10;• Escalations needed"
                                onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))} />
                        </div>

                        {!isApproved && (
                            <div className="flex gap-12" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                <button className="btn btn-secondary" onClick={handleAutoFillFromStories} title={`Auto-fill from ${weekStories.length} stories for ${state.selectedWeek}`}>
                                    <FileText size={14} /> Fill from Stories ({weekStories.length})
                                </button>
                                <button className="btn btn-secondary" onClick={handleGenerateAI} disabled={isGenerating}>
                                    {isGenerating ? <RefreshCw size={14} className="spin" /> : <Wand2 size={14} />}
                                    {isGenerating ? ' Generating...' : ' AI Summary ✨'}
                                </button>
                                <button className="btn btn-primary" onClick={handleSave}>
                                    <Save size={14} /> Submit Report
                                </button>
                                {report?.status === 'rejected' && (
                                    <span style={{ color: 'var(--red)', fontSize: 12 }}>
                                        ⚠ Rejected: {report.approvalComment}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
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
