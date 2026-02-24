import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { AlertTriangle, ShieldCheck, Wand2, Save, Edit2, XCircle } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:3001/api';

export default function RiskPanel() {
    const { state, dispatch } = useDashboard();



    const [colFilters, setColFilters] = useState({
        id: '',
        title: '',
        risk: '',
        mitigation: '',
        status: '',
        uploadedDate: ''
    });

    const [activeTab, setActiveTab] = useState<'all' | 'has-risk' | 'no-risk'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editMitigation, setEditMitigation] = useState('');
    const [editRiskDesc, setEditRiskDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // All stories (with or without risk) from this project
    const allProjectStories = state.jiraStories.filter(s => s.projectId === state.selectedProjectId);
    const riskStories = allProjectStories.filter(s => s.risksMitigation);
    const noRiskStories = allProjectStories.filter(s => !s.risksMitigation);

    const enrichedRisks = riskStories.map(s => ({
        ...s,
        riskStatus: s.aiMitigation === '(Cancelled)' ? 'cancelled' : s.aiMitigation ? 'mitigated' : 'open'
    }));
    const enrichedNoRisk = noRiskStories.map(s => ({ ...s, riskStatus: 'none' }));

    const sourceList = activeTab === 'has-risk' ? enrichedRisks : activeTab === 'no-risk' ? enrichedNoRisk : [...enrichedRisks, ...enrichedNoRisk];

    const filteredRisks = sourceList.filter(r => {
        if (colFilters.id && !r.id.toLowerCase().includes(colFilters.id.toLowerCase())) return false;
        if (colFilters.title && !r.title.toLowerCase().includes(colFilters.title.toLowerCase())) return false;
        if (colFilters.risk && !(r.risksMitigation || '').toLowerCase().includes(colFilters.risk.toLowerCase())) return false;
        if (colFilters.mitigation && !(r.aiMitigation || '').toLowerCase().includes(colFilters.mitigation.toLowerCase())) return false;
        if (colFilters.status && !(r.riskStatus || '').toLowerCase().includes(colFilters.status.toLowerCase())) return false;
        if (colFilters.uploadedDate && !(r.pulledDate || '').toLowerCase().includes(colFilters.uploadedDate.toLowerCase())) return false;
        return true;
    });

    const openCount = enrichedRisks.filter(r => r.riskStatus === 'open').length;
    const mitigatedCount = enrichedRisks.filter(r => r.riskStatus === 'mitigated').length;

    async function handleGenerate(riskId: string, riskDesc: string) {
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_BASE}/ai/suggest-mitigation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ riskDescription: riskDesc })
            });
            const data = await res.json();
            if (data.mitigation) {
                setEditMitigation(data.mitigation);
            }
        } catch (error) {
            console.error('Failed to generate mitigation', error);
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleSave(story: any) {
        try {
            const payload: any = { aiMitigation: editMitigation };
            if (editRiskDesc) payload.risksMitigation = editRiskDesc;

            await fetch(`${API_BASE}/stories/${story.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const newStories = state.jiraStories.map(s => s.id === story.id ? { ...s, ...payload } : s);
            dispatch({ type: 'SET_DATA', payload: { jiraStories: newStories } });
            setEditingId(null);
            setEditMitigation('');
            setEditRiskDesc('');
        } catch (error) {
            console.error('Failed to save mitigation', error);
        }
    }

    async function handleStatusChange(storyId: string, newStatus: 'open' | 'mitigated' | 'cancelled') {
        try {
            const payload =
                newStatus === 'mitigated' ? { aiMitigation: '(Manually marked as mitigated)' } :
                    newStatus === 'cancelled' ? { aiMitigation: '(Cancelled)' } :
                        { aiMitigation: '' };
            await fetch(`${API_BASE}/stories/${storyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const newStories = state.jiraStories.map(s => s.id === storyId ? { ...s, ...payload } : s);
            dispatch({ type: 'SET_DATA', payload: { jiraStories: newStories } });
        } catch (err) {
            console.error('Failed to update status', err);
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-label" style={{ margin: 0 }}>Risk Register (From Stories)</div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {(['all', 'has-risk', 'no-risk'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '6px 16px',
                                fontSize: 12,
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: activeTab === tab ? 'var(--violet)' : 'var(--bg-surface)',
                                color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                                transition: 'all 0.2s',
                            }}
                        >
                            {tab === 'all' ? `All (${allProjectStories.length})` :
                                tab === 'has-risk' ? `🔴 Has Risk (${riskStories.length})` :
                                    `✅ No Risk (${noRiskStories.length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                    { label: 'Total Risks (From DB)', value: enrichedRisks.length, color: 'var(--violet)' },
                    { label: 'Open', value: openCount, color: 'var(--red)' },
                    { label: 'Mitigated (AI / Manual)', value: mitigatedCount, color: 'var(--emerald)' },
                ].map(c => (
                    <div key={c.label} className="card" style={{ textAlign: 'center', padding: 16 }}>
                        <div className="kpi-label">{c.label}</div>
                        <div className="kpi-value" style={{ fontSize: 28, color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title"><AlertTriangle size={15} /> Board Story Risks</div>
                    <div className="text-xs text-muted">{filteredRisks.length} matching rows</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>St. ID</th>
                                <th>Title</th>
                                <th>Risk Description</th>
                                <th style={{ minWidth: 250 }}>Mitigation</th>
                                <th>Uploaded Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            <tr className="filter-row" style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '8px 16px' }}><input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..." value={colFilters.id} onChange={e => setColFilters(f => ({ ...f, id: e.target.value }))} /></th>
                                <th style={{ padding: '8px 16px' }}><input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..." value={colFilters.title} onChange={e => setColFilters(f => ({ ...f, title: e.target.value }))} /></th>
                                <th style={{ padding: '8px 16px' }}><input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..." value={colFilters.risk} onChange={e => setColFilters(f => ({ ...f, risk: e.target.value }))} /></th>
                                <th style={{ padding: '8px 16px' }}><input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..." value={colFilters.mitigation} onChange={e => setColFilters(f => ({ ...f, mitigation: e.target.value }))} /></th>
                                <th style={{ padding: '8px 16px' }}><input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..." value={colFilters.uploadedDate} onChange={e => setColFilters(f => ({ ...f, uploadedDate: e.target.value }))} /></th>
                                <th style={{ padding: '8px 16px' }}><input type="text" className="form-input" style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }} placeholder="Search..." value={colFilters.status} onChange={e => setColFilters(f => ({ ...f, status: e.target.value }))} /></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRisks.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 700, color: 'var(--violet-light)', fontFamily: 'monospace' }}>{r.id}</td>
                                    <td style={{ fontWeight: 600, fontSize: 12 }}>{r.title}</td>
                                    <td style={{ maxWidth: 200 }}>
                                        {editingId === r.id ? (
                                            <textarea
                                                className="form-textarea"
                                                rows={3}
                                                value={editRiskDesc}
                                                onChange={e => setEditRiskDesc(e.target.value)}
                                                placeholder="Edit risk description..."
                                                style={{ fontSize: 12, minWidth: 150 }}
                                            />
                                        ) : (
                                            <span className="text-sm text-secondary">{r.risksMitigation || <em className="text-muted">No risk</em>}</span>
                                        )}
                                    </td>
                                    <td style={{ minWidth: 250 }}>
                                        {editingId === r.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <textarea
                                                    className="form-textarea"
                                                    rows={3}
                                                    value={editMitigation}
                                                    onChange={e => setEditMitigation(e.target.value)}
                                                    placeholder="Enter mitigation or use AI..."
                                                />
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleGenerate(r.id, editRiskDesc || r.risksMitigation!)} disabled={isGenerating}>
                                                        <Wand2 size={12} /> {isGenerating ? 'Wait...' : 'AI Suggest'}
                                                    </button>
                                                    <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleSave(r)}>
                                                        <Save size={12} /> Save
                                                    </button>
                                                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11, background: 'transparent' }} onClick={() => { setEditingId(null); setEditRiskDesc(''); setEditMitigation(''); }}>
                                                        <XCircle size={12} /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm border" style={{ padding: '6px 12px', borderRadius: 6, minHeight: 32, background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
                                                {r.aiMitigation ? r.aiMitigation : <span className="text-muted italic">No mitigation provided.</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-xs text-muted">{r.pulledDate || 'N/A'}</td>
                                    <td>
                                        <select
                                            className="form-input"
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: 12,
                                                width: 'auto',
                                                background: r.riskStatus === 'open' ? 'rgba(239,68,68,0.12)' : r.riskStatus === 'mitigated' ? 'rgba(16,185,129,0.12)' : r.riskStatus === 'cancelled' ? 'rgba(245,158,11,0.1)' : 'var(--bg-glass)',
                                                color: r.riskStatus === 'open' ? 'var(--red)' : r.riskStatus === 'mitigated' ? 'var(--emerald)' : r.riskStatus === 'cancelled' ? 'var(--amber)' : 'var(--text-muted)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 6,
                                                cursor: r.riskStatus === 'none' ? 'default' : 'pointer',
                                            }}
                                            value={r.riskStatus}
                                            disabled={r.riskStatus === 'none'}
                                            onChange={e => handleStatusChange(r.id, e.target.value as 'open' | 'mitigated' | 'cancelled')}
                                        >
                                            {r.riskStatus === 'none' && <option value="none">No Risk</option>}
                                            <option value="open">🔴 Open</option>
                                            <option value="mitigated">🟢 Mitigated</option>
                                            <option value="cancelled">⚫ Cancelled</option>
                                        </select>
                                    </td>
                                    <td>
                                        {editingId !== r.id && (
                                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}
                                                onClick={() => { setEditingId(r.id); setEditMitigation(r.aiMitigation || ''); setEditRiskDesc(r.risksMitigation || ''); }}>
                                                <Edit2 size={12} /> Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
