import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import type { Milestone, MilestoneStatus } from '../types/index';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { Plus, Edit2, Save, X, Calendar, Trash2 } from 'lucide-react';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR = 2026;
const YEAR_START = new Date(YEAR, 0, 1);
const CHART_DAYS = 365;

const STATUS_COLORS: Record<string, string> = {
    'on-track': '#10b981',
    'at-risk': '#f59e0b',
    'delayed': '#ef4444',
    'completed': '#22d3ee',
};

const STATUS_OPTS: MilestoneStatus[] = ['on-track', 'at-risk', 'delayed', 'completed'];

function dayOffset(dateStr: string) {
    const d = parseISO(dateStr);
    return differenceInDays(d, YEAR_START);
}

const API_BASE = 'http://127.0.0.1:3001/api';

const EMPTY_FORM = {
    title: '',
    description: '',
    startDate: '',
    targetDate: '',
    actualDate: '',
    status: 'on-track' as MilestoneStatus,
};

export default function GanttChart() {
    const { state, dispatch } = useDashboard();
    const milestones = state.milestones.filter(m => m.projectId === state.selectedProjectId);
    const project = state.projects.find(p => p.id === state.selectedProjectId);

    const [showForm, setShowForm] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function handleDelete(id: string) {
        if (!window.confirm('Delete this milestone? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            await fetch(`${API_BASE}/milestones/${id}`, { method: 'DELETE' });
            dispatch({ type: 'SET_DATA', payload: { milestones: state.milestones.filter(m => m.id !== id) } });
        } catch (e) {
            console.error('Failed to delete milestone', e);
        } finally {
            setDeletingId(null);
        }
    }

    const SVG_W = 1100;
    const ROW_H = 44;
    const LABEL_W = 300;
    const CHART_W = SVG_W - LABEL_W;
    const HEADER_H = 36;
    const totalH = HEADER_H + ROW_H * milestones.length + 24;
    const todayOffset = (differenceInDays(new Date(), YEAR_START) / CHART_DAYS) * CHART_W;

    function openAdd() {
        setEditingMilestone(null);
        setForm({ ...EMPTY_FORM });
        setShowForm(true);
    }

    function openEdit(m: Milestone) {
        setEditingMilestone(m);
        setForm({
            title: m.title,
            description: m.description,
            startDate: (m as any).startDate || '',
            targetDate: m.targetDate || '',
            actualDate: m.actualDate || '',
            status: m.status,
        });
        setShowForm(true);
    }

    async function handleSave() {
        if (!form.title || !form.targetDate) return;
        setSaving(true);

        const milestoneData: any = {
            id: editingMilestone?.id || `ms-${Date.now()}`,
            projectId: state.selectedProjectId,
            title: form.title,
            description: form.description,
            startDate: form.startDate,
            targetDate: form.targetDate,
            actualDate: form.actualDate || null,
            status: form.status,
        };

        try {
            if (editingMilestone) {
                await fetch(`${API_BASE}/milestones/${editingMilestone.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(milestoneData),
                });
                const updated = state.milestones.map(m => m.id === editingMilestone.id ? milestoneData : m);
                dispatch({ type: 'SET_DATA', payload: { milestones: updated } });
            } else {
                await fetch(`${API_BASE}/milestones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(milestoneData),
                });
                dispatch({ type: 'SET_DATA', payload: { milestones: [...state.milestones, milestoneData] } });
            }
        } catch (e) {
            // Optimistic update already applied via dispatch above; log error
            console.error('Failed to sync milestone', e);
        }

        setSaving(false);
        setShowForm(false);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-label" style={{ margin: 0 }}>Milestone Tracker — {YEAR}</div>
                <button className="btn btn-primary" onClick={openAdd} style={{ padding: '8px 18px', fontSize: 13 }}>
                    <Plus size={15} /> Add Milestone
                </button>
            </div>

            {/* Milestone Table */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title"><Calendar size={15} /> Milestone List</div>
                    <div className="text-xs text-muted">{milestones.length} milestones</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Milestone</th>
                                <th>Description</th>
                                <th>Start Date</th>
                                <th>Target Date</th>
                                <th>Actual Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {milestones.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No milestones yet. Click "Add Milestone" to get started.</td></tr>
                            )}
                            {milestones.map(m => (
                                <tr key={m.id}>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.title}</td>
                                    <td className="text-sm text-muted" style={{ maxWidth: 200 }}>{m.description || '—'}</td>
                                    <td className="text-xs text-muted">{(m as any).startDate || '—'}</td>
                                    <td style={{ fontWeight: 600, color: STATUS_COLORS[m.status] || 'var(--text-primary)' }}>
                                        {m.targetDate ? format(parseISO(m.targetDate), 'dd MMM yyyy') : '—'}
                                    </td>
                                    <td className="text-xs text-muted">{m.actualDate ? format(parseISO(m.actualDate), 'dd MMM yyyy') : '—'}</td>
                                    <td>
                                        <span className={`status-pill ${m.status === 'completed' ? 'pill-done' : m.status === 'delayed' ? 'pill-blocked' : m.status === 'at-risk' ? 'pill-inprogress' : 'pill-todo'}`}>
                                            {m.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openEdit(m)}>
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '5px 10px', fontSize: 12, color: 'var(--red)', borderColor: 'var(--red)' }}
                                                onClick={() => handleDelete(m.id)}
                                                disabled={deletingId === m.id}
                                            >
                                                <Trash2 size={12} /> {deletingId === m.id ? '…' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Gantt Chart */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title">📅 {project?.name || 'Project'} — Gantt Chart</div>
                    <div className="flex gap-12">
                        {Object.entries(STATUS_COLORS).map(([s, c]) => (
                            <span key={s} className="text-xs" style={{ color: c, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width={10} height={10}><polygon points="5,0 10,5 5,10 0,5" fill={c} /></svg>
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="gantt-wrapper" style={{ overflowX: 'auto' }}>
                    <svg width={SVG_W} height={Math.max(totalH, HEADER_H + 30)} style={{ minWidth: SVG_W }}>
                        {/* Month grid */}
                        {MONTH_LABELS.map((mo, i) => {
                            const x = LABEL_W + (i / 12) * CHART_W;
                            return (
                                <g key={mo}>
                                    <line x1={x} y1={HEADER_H} x2={x} y2={totalH} stroke="rgba(255,255,255,0.04)" />
                                    <text x={x + CHART_W / 24} y={20} fill="var(--text-muted)" fontSize={10} textAnchor="middle">{mo}</text>
                                </g>
                            );
                        })}

                        {/* Today line */}
                        {todayOffset > 0 && todayOffset < CHART_W && (
                            <>
                                <line x1={LABEL_W + todayOffset} y1={HEADER_H} x2={LABEL_W + todayOffset} y2={totalH}
                                    stroke="#6d6cff" strokeWidth={1.5} strokeDasharray="5 3" />
                                <text x={LABEL_W + todayOffset + 4} y={HEADER_H + 12} fill="#6d6cff" fontSize={9}>TODAY</text>
                            </>
                        )}

                        {/* Milestone rows */}
                        {milestones.map((ms, i) => {
                            const y = HEADER_H + i * ROW_H;
                            const color = STATUS_COLORS[ms.status] || '#ccc';
                            const startDay = (ms as any).startDate ? dayOffset((ms as any).startDate) : null;
                            const endDay = ms.targetDate ? dayOffset(ms.targetDate) : null;

                            const barX = startDay !== null ? LABEL_W + (startDay / CHART_DAYS) * CHART_W : null;
                            const barEnd = endDay !== null ? LABEL_W + (endDay / CHART_DAYS) * CHART_W : null;
                            const barW = barX !== null && barEnd !== null ? Math.max(10, barEnd - barX) : null;

                            return (
                                <g key={ms.id}>
                                    {i % 2 === 0 && <rect x={0} y={y} width={SVG_W} height={ROW_H} fill="rgba(255,255,255,0.012)" />}
                                    <text x={8} y={y + 20} fill="var(--text-primary)" fontSize={11} fontWeight={600} style={{ fontFamily: 'Inter,sans-serif' }}>
                                        {ms.title.length > 24 ? ms.title.slice(0, 24) + '…' : ms.title}
                                    </text>
                                    <text x={8} y={y + 33} fill="var(--text-muted)" fontSize={9} style={{ fontFamily: 'Inter,sans-serif' }}>
                                        {ms.targetDate && isValid(parseISO(ms.targetDate)) ? `Target: ${format(parseISO(ms.targetDate), 'MMM d')}` : ''}
                                    </text>
                                    <rect x={LABEL_W - 72} y={y + 13} width={66} height={16} rx={8} fill={`${color}22`} />
                                    <text x={LABEL_W - 39} y={y + 25} fill={color} fontSize={9} textAnchor="middle" fontWeight={700}>
                                        {ms.status.toUpperCase()}
                                    </text>
                                    {/* Bar from start to target */}
                                    {barX !== null && barW !== null && (
                                        <rect x={barX} y={y + 12} width={barW} height={16} rx={4} fill={`${color}55`} stroke={color} strokeWidth={1} />
                                    )}
                                    {/* Diamond at target */}
                                    {barEnd !== null && (
                                        <polygon
                                            points={`${barEnd},${y + 6} ${barEnd + 7},${y + 20} ${barEnd},${y + 34} ${barEnd - 7},${y + 20}`}
                                            fill={color} opacity={0.9}
                                        />
                                    )}
                                </g>
                            );
                        })}
                        {milestones.length === 0 && (
                            <text x={SVG_W / 2} y={HEADER_H + 24} fill="var(--text-muted)" fontSize={12} textAnchor="middle">No milestones to display</text>
                        )}
                    </svg>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: 500, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 17 }}>{editingMilestone ? '✏️ Edit Milestone' : '➕ Add Milestone'}</h3>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group">
                                <label className="form-label">Milestone Title *</label>
                                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Phase 1 Completion" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details..." />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Target Date *</label>
                                    <input type="date" className="form-input" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Actual Date (if done)</label>
                                    <input type="date" className="form-input" value={form.actualDate} onChange={e => setForm(f => ({ ...f, actualDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as MilestoneStatus }))}>
                                        {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title || !form.targetDate}>
                                    <Save size={14} /> {saving ? 'Saving...' : editingMilestone ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
