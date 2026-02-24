import { useState, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import type { JiraStory, TaskStatus } from '../types/index';
import { Plus, Upload, FileSpreadsheet, CheckCircle, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUS_OPTS: TaskStatus[] = ['todo', 'inprogress', 'done', 'blocked'];
const EPIC_OPTS = ['Dashboard', 'User Management', 'Auth', 'Notifications', 'Performance', 'Search', 'DevOps', 'Settings', 'Export', 'Offline Mode', 'iOS', 'Android', 'ML', 'Release'];
const AVATAR_COLORS = ['#6d6cff', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#a78bfa'];

function generateId(prefix: string) {
    return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function DeveloperDashboard() {
    const { state, dispatch } = useDashboard();
    const [activeTab, setActiveTab] = useState<'tasks' | 'add' | 'import'>('tasks');
    const [toastMsg, setToastMsg] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [importPreview, setImportPreview] = useState<JiraStory[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const project = state.projects.find(p => p.id === state.selectedProjectId);
    const myId = 'tm2'; // Rahul — developer persona
    const myMember = state.teamMembers.find(m => m.id === myId);

    const myStories = state.jiraStories.filter(s => s.assigneeId === myId && s.projectId === state.selectedProjectId);
    const weekStories = myStories.filter(s => s.week === state.selectedWeek);

    const [form, setForm] = useState({
        title: '', storyPoints: 3, status: 'todo' as TaskStatus,
        epic: 'Dashboard', sprint: 'Sprint 4',
    });

    function showToast(msg: string, type: 'success' | 'error' = 'success') {
        setToastMsg(msg); setToastType(type);
        setTimeout(() => setToastMsg(''), 3500);
    }

    const API_BASE = 'http://127.0.0.1:3001/api';

    async function handleAddStory() {
        if (!form.title.trim()) { showToast('Please enter a story title', 'error'); return; }
        const story: JiraStory = {
            id: generateId(project?.code ?? 'PROJ'),
            title: form.title.trim(),
            assigneeId: myId,
            storyPoints: form.storyPoints,
            status: form.status,
            epic: form.epic,
            sprint: form.sprint,
            week: state.selectedWeek,
            projectId: state.selectedProjectId,
        };

        try {
            await fetch(`${API_BASE}/stories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(story),
            });
            dispatch({ type: 'ADD_STORY', payload: story });
            setForm({ title: '', storyPoints: 3, status: 'todo', epic: 'Dashboard', sprint: 'Sprint 4' });
            showToast(`Story ${story.id} added successfully ✓`);
        } catch {
            showToast('Failed to sync with backend', 'error');
        }
    }

    async function handleStatusChange(storyId: string, newStatus: TaskStatus) {
        const s = state.jiraStories.find(x => x.id === storyId);
        if (s) {
            try {
                const updated = { ...s, status: newStatus };
                await fetch(`${API_BASE}/stories/${storyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });
                dispatch({ type: 'UPDATE_STORY', payload: updated });
            } catch {
                showToast('Failed to update status on server', 'error');
            }
        }
    }

    function parseExcel(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet);
                const stories: JiraStory[] = rows.map((row, i) => ({
                    id: row['Story ID'] ?? generateId(project?.code ?? 'PROJ'),
                    title: row['Title'] ?? `Story ${i + 1}`,
                    assigneeId: myId,
                    storyPoints: Number(row['Story Points']) || 3,
                    status: (row['Status']?.toLowerCase().replace(' ', '') ?? 'todo') as TaskStatus,
                    epic: row['Epic'] ?? 'General',
                    sprint: row['Sprint'] ?? 'Sprint 4',
                    week: row['Week'] ?? state.selectedWeek,
                    projectId: state.selectedProjectId,
                }));
                setImportPreview(stories);
                showToast(`Parsed ${stories.length} stories from Excel`);
            } catch {
                showToast('Failed to parse Excel. Check format.', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) parseExcel(file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) parseExcel(file);
    }

    async function confirmImport() {
        try {
            await fetch(`${API_BASE}/stories/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(importPreview),
            });
            importPreview.forEach(s => dispatch({ type: 'ADD_STORY', payload: s }));
            showToast(`${importPreview.length} stories imported successfully ✓`);
            setImportPreview([]);
        } catch {
            showToast('Bulk import failed', 'error');
        }
    }

    function downloadSampleExcel() {
        const sampleData = [
            { 'Story ID': 'PROJ-001', 'Title': 'Sample story 1', 'Assignee': 'Dev', 'Story Points': 5, 'Status': 'todo', 'Epic': 'Dashboard', 'Sprint': 'Sprint 4', 'Week': '2026-W08' },
            { 'Story ID': 'PROJ-002', 'Title': 'Sample story 2', 'Assignee': 'Dev', 'Story Points': 3, 'Status': 'inprogress', 'Epic': 'Auth', 'Sprint': 'Sprint 4', 'Week': '2026-W08' },
        ];
        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Jira Stories');
        XLSX.writeFile(wb, 'jira_stories_template.xlsx');
    }

    const doneCount = weekStories.filter(s => s.status === 'done').length;
    const totalPts = weekStories.reduce((a, s) => a + s.storyPoints, 0);
    const donePts = weekStories.filter(s => s.status === 'done').reduce((a, s) => a + s.storyPoints, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="section-label">Developer Portal — {myMember?.name}</div>

            {/* My stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                    { label: 'My Stories (Week)', value: weekStories.length, color: 'var(--violet-light)' },
                    { label: 'Stories Done', value: doneCount, color: 'var(--emerald)' },
                    { label: 'Story Points Done', value: `${donePts}/${totalPts}`, color: 'var(--cyan)' },
                    { label: 'Completion Rate', value: `${weekStories.length ? Math.round(doneCount / weekStories.length * 100) : 0}%`, color: 'var(--amber)' },
                ].map(c => (
                    <div key={c.label} className="kpi-card" style={{ '--accent-color': c.color } as React.CSSProperties}>
                        <div className="kpi-label">{c.label}</div>
                        <div className="kpi-value" style={{ color: c.color, fontSize: 24 }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* Internal nav */}
            <div className="tabs">
                {[{ id: 'tasks', label: 'My Tasks' }, { id: 'add', label: 'Add Story' }, { id: 'import', label: 'Excel Import' }].map(t => (
                    <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.id as any)}>{t.label}</button>
                ))}
            </div>

            {/* My tasks */}
            {activeTab === 'tasks' && (
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">📋 My Stories — {state.selectedWeek}</div>
                        <div className="text-xs text-muted">{project?.name}</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>ID</th><th>Title</th><th>Epic</th><th>SP</th><th>Sprint</th><th>Status</th></tr></thead>
                            <tbody>
                                {myStories.map((s, i) => (
                                    <tr key={s.id}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--violet-light)', fontWeight: 700 }}>{s.id}</td>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.title}</td>
                                        <td><span className="text-xs" style={{ background: 'var(--bg-glass)', padding: '2px 8px', borderRadius: 4 }}>{s.epic}</span></td>
                                        <td><span style={{ fontWeight: 700, color: 'var(--cyan)' }}>{s.storyPoints}</span></td>
                                        <td className="text-xs text-muted">{s.sprint}</td>
                                        <td>
                                            <select
                                                value={s.status}
                                                onChange={e => handleStatusChange(s.id, e.target.value as TaskStatus)}
                                                style={{
                                                    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6,
                                                    color: s.status === 'done' ? 'var(--emerald)' : s.status === 'blocked' ? 'var(--red)' : s.status === 'inprogress' ? 'var(--violet-light)' : 'var(--text-muted)',
                                                    padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                                                }}>
                                                {STATUS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {myStories.length === 0 && (
                                    <tr><td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: 32 }}>No stories assigned. Use "Add Story" to create one.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add story form */}
            {activeTab === 'add' && (
                <div className="card">
                    <div className="card-header">
                        <div className="card-title"><Plus size={15} /> Add New Jira Story</div>
                        <div className="text-xs text-muted">{project?.code} • {state.selectedWeek}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 600 }}>
                        <div className="form-group">
                            <label className="form-label">Story Title *</label>
                            <input className="form-input" value={form.title}
                                placeholder="As a user I want to..."
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Story Points</label>
                                <select className="form-select" value={form.storyPoints}
                                    onChange={e => setForm(f => ({ ...f, storyPoints: Number(e.target.value) }))}>
                                    {[1, 2, 3, 5, 8, 13].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
                                    {STATUS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Epic</label>
                                <select className="form-select" value={form.epic}
                                    onChange={e => setForm(f => ({ ...f, epic: e.target.value }))}>
                                    {EPIC_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sprint</label>
                                <input className="form-input" value={form.sprint}
                                    onChange={e => setForm(f => ({ ...f, sprint: e.target.value }))} />
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={handleAddStory}>
                            <Plus size={14} /> Add Story
                        </button>
                    </div>
                </div>
            )}

            {/* Excel import */}
            {activeTab === 'import' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title"><FileSpreadsheet size={15} /> Excel Import — Jira Stories</div>
                            <button className="btn btn-secondary btn-sm" onClick={downloadSampleExcel}>
                                <Upload size={13} /> Download Template
                            </button>
                        </div>
                        <div
                            className={`drop-zone ${dragOver ? 'active' : ''}`}
                            onClick={() => fileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <FileSpreadsheet size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop your Excel file here</div>
                            <div className="text-xs text-muted">or click to browse • .xlsx / .xls supported</div>
                            <div className="text-xs text-muted" style={{ marginTop: 8 }}>
                                Expected columns: Story ID, Title, Story Points, Status, Epic, Sprint, Week
                            </div>
                            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileChange} />
                        </div>
                    </div>

                    {importPreview.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">Preview — {importPreview.length} stories ready to import</div>
                                <div className="flex gap-8">
                                    <button className="btn btn-success btn-sm" onClick={confirmImport}><CheckCircle size={13} /> Confirm Import</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setImportPreview([])}><Trash2 size={13} /> Clear</button>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead><tr><th>ID</th><th>Title</th><th>SP</th><th>Status</th><th>Epic</th><th>Sprint</th><th>Week</th></tr></thead>
                                    <tbody>
                                        {importPreview.map(s => (
                                            <tr key={s.id}>
                                                <td style={{ color: 'var(--violet-light)', fontFamily: 'monospace' }}>{s.id}</td>
                                                <td style={{ color: 'var(--text-primary)' }}>{s.title}</td>
                                                <td style={{ color: 'var(--cyan)', fontWeight: 700 }}>{s.storyPoints}</td>
                                                <td><span className={`status-pill pill-${s.status}`}>{s.status}</span></td>
                                                <td className="text-xs">{s.epic}</td>
                                                <td className="text-xs text-muted">{s.sprint}</td>
                                                <td className="text-xs text-muted">{s.week}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {toastMsg && (
                <div className={`toast ${toastType}`}>
                    <CheckCircle size={16} color={toastType === 'success' ? 'var(--emerald)' : 'var(--red)'} />
                    {toastMsg}
                </div>
            )}
        </div>
    );
}
