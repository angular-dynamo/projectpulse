import React, { useRef, useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Coffee, Plane, Stethoscope, Home, Upload, RefreshCw, Download } from 'lucide-react';
import * as xlsx from 'xlsx';

const AVATAR_COLORS = ['#6d6cff', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#a78bfa'];

const LeaveTypeIcon: Record<string, React.ReactNode> = {
    vacation: <Plane size={10} />,
    sick: <Stethoscope size={10} />,
    holiday: <Coffee size={10} />,
    wfh: <Home size={10} />,
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>
                {payload.map((p: any, i: number) => (
                    <div key={i} style={{ color: p.fill, display: 'flex', gap: 8 }}>
                        <span>{p.name}:</span><span style={{ fontWeight: 700 }}>{p.value}h</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function CapacityChart() {
    const { state, dispatch } = useDashboard();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    const fileInput = useRef<HTMLInputElement>(null);

    const devIds = ['tm1', 'tm2', 'tm3', 'tm4', 'tm5', 'tm6'];
    const devMembers = state.teamMembers.filter(m => devIds.includes(m.id));
    const weekLeaves = state.leaveEntries.filter(l => l.week === state.selectedWeek);

    const chartData = devMembers.map((m, i) => {
        const leave = weekLeaves.filter(l => l.memberId === m.id).reduce((a, l) => a + l.hoursOff, 0);
        const available = m.totalHoursPerWeek - leave;
        const allocated = Math.max(0, available - Math.floor(Math.random() * 8));
        return {
            name: m.name.split(' ')[0],
            fullName: m.name,
            role: m.role,
            Total: m.totalHoursPerWeek,
            Available: available,
            Allocated: allocated,
            Leave: leave,
            color: AVATAR_COLORS[i],
        };
    });

    const totalLeave = weekLeaves.reduce((a, l) => a + l.hoursOff, 0);
    const totalCapacity = devMembers.reduce((a, m) => a + m.totalHoursPerWeek, 0);
    const effectiveCapacity = totalCapacity - totalLeave;

    const API_BASE = 'http://127.0.0.1:3001/api';

    const handleLeavesImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setMsg({ text: '', type: '' });

        try {
            const data = await file.arrayBuffer();
            const workbook = xlsx.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = xlsx.utils.sheet_to_json(worksheet);

            if (!json.length) throw new Error("File is empty or invalid format.");

            // Transform uploaded data to leave_entries format
            // Expected columns: ID, Member ID, Week, Hours Off, Type
            const formattedLeaves = json.map((row: any) => ({
                id: row['ID'] || `LV-${Math.floor(Math.random() * 10000)}`,
                memberId: row['Member ID'] || row['memberId'] || 'tm1',
                week: row['Week'] || row['week'] || state.selectedWeek,
                hoursOff: Number(row['Hours Off'] || row['hoursOff']) || 0,
                type: (row['Type'] || row['type'] || 'vacation').toLowerCase()
            }));

            const res = await fetch(`${API_BASE}/leave_entries/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedLeaves)
            });

            if (!res.ok) throw new Error('Failed to import leaves');

            // Update local state
            const nextLeaves = [...state.leaveEntries];
            for (const fl of formattedLeaves) {
                const idx = nextLeaves.findIndex(l => l.id === fl.id);
                if (idx >= 0) {
                    nextLeaves[idx] = { ...nextLeaves[idx], ...fl };
                } else {
                    nextLeaves.push(fl as any);
                }
            }

            dispatch({ type: 'SET_DATA', payload: { leaveEntries: nextLeaves } });
            setMsg({ type: 'success', text: `Successfully imported ${formattedLeaves.length} leave records.` });
        } catch (error: any) {
            setMsg({ type: 'error', text: error.message || 'Import failed' });
        } finally {
            setLoading(false);
            if (fileInput.current) fileInput.current.value = '';

            // clear msg after 3 seconds
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        }
    };

    const downloadLeavesTemplate = () => {
        const wb = xlsx.utils.book_new();
        const headers = ['ID', 'Member ID', 'Week', 'Hours Off', 'Type'];
        const sampleRow = { 'ID': 'LV-001', 'Member ID': 'tm1', 'Week': state.selectedWeek, 'Hours Off': 8, 'Type': 'vacation' };

        const ws = xlsx.utils.json_to_sheet([sampleRow], { header: headers });
        xlsx.utils.book_append_sheet(wb, ws, 'Template');
        xlsx.writeFile(wb, `leaves_template.xlsx`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-label" style={{ margin: 0 }}>Leave-Adjusted Team Capacity</div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {msg.text && (
                        <span style={{
                            fontSize: 12,
                            color: msg.type === 'error' ? 'var(--red)' : 'var(--emerald)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}>
                            {msg.text}
                        </span>
                    )}

                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        ref={fileInput}
                        style={{ display: 'none' }}
                        onChange={handleLeavesImport}
                    />

                    <button
                        className="btn btn-secondary"
                        onClick={downloadLeavesTemplate}
                        style={{ padding: '6px 12px', fontSize: 13 }}
                        title="Download Template"
                    >
                        <Download size={16} /> Template
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={() => fileInput.current?.click()}
                        disabled={loading}
                        style={{ padding: '6px 16px', fontSize: 13 }}
                    >
                        {loading ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />}
                        {loading ? 'Uploading...' : 'Upload Leaves'}
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                    { label: 'Total Capacity', value: `${totalCapacity}h`, color: 'var(--text-secondary)' },
                    { label: 'On Leave', value: `${totalLeave}h`, color: 'var(--red)' },
                    { label: 'Available Capacity', value: `${effectiveCapacity}h`, color: 'var(--emerald)' },
                    { label: 'Utilization', value: `${Math.round((effectiveCapacity - 20) / effectiveCapacity * 100)}%`, color: 'var(--violet-light)' },
                ].map(c => (
                    <div key={c.label} className="card" style={{ textAlign: 'center', padding: 16 }}>
                        <div className="kpi-label">{c.label}</div>
                        <div className="kpi-value" style={{ color: c.color, fontSize: 22 }}>{c.value}</div>
                    </div>
                ))}
            </div>

            <div className="charts-grid">
                {/* Capacity bar chart */}
                <div className="card chart-full">
                    <div className="card-header">
                        <div className="card-title">Per-Person Capacity Breakdown — {state.selectedWeek}</div>
                        <div className="text-xs text-muted">Hours: Total / Available / Allocated</div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData} barGap={3} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 45]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Total" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} name="Total" />
                            <Bar dataKey="Available" fill="#10b981" radius={[4, 4, 0, 0]} name="Available" />
                            <Bar dataKey="Allocated" fill="#6d6cff" radius={[4, 4, 0, 0]} name="Allocated" />
                            {chartData[0]?.Leave > 0 && <Bar dataKey="Leave" fill="#ef4444" radius={[4, 4, 0, 0]} name="Leave" />}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Team leave details */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Team Leave Registry</div>
                        <div className="text-xs text-muted">Week: {state.selectedWeek}</div>
                    </div>
                    <table className="data-table">
                        <thead><tr><th>Team Member</th><th>Type</th><th>Hours Off</th><th>Available</th></tr></thead>
                        <tbody>
                            {devMembers.map((m, i) => {
                                const leaves = weekLeaves.filter(l => l.memberId === m.id);
                                const totalOff = leaves.reduce((a, l) => a + l.hoursOff, 0);
                                return (
                                    <tr key={m.id}>
                                        <td>
                                            <div className="flex items-center gap-8">
                                                <div className="avatar" style={{ background: AVATAR_COLORS[i], width: 24, height: 24, fontSize: 9 }}>{m.avatar}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{m.name}</div>
                                                    <div className="text-xs text-muted">{m.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {leaves.length > 0 ? leaves.map((l, i) => (
                                                <span key={i} className="status-pill" style={{ background: 'var(--red-dim)', color: 'var(--red)', fontSize: 10, gap: 4 }}>
                                                    {LeaveTypeIcon[l.type]} {l.type}
                                                </span>
                                            )) : <span className="text-emerald text-xs">✓ Full day</span>}
                                        </td>
                                        <td><span style={{ color: 'var(--red)', fontWeight: 700 }}>{totalOff > 0 ? `-${totalOff}h` : '—'}</span></td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--emerald)', fontSize: 13 }}>{m.totalHoursPerWeek - totalOff}h</div>
                                                <div className="progress-bar-wrap" style={{ marginTop: 4, width: 80 }}>
                                                    <div className="progress-bar-fill" style={{ width: `${((m.totalHoursPerWeek - totalOff) / m.totalHoursPerWeek) * 100}%`, background: `linear-gradient(90deg, var(--emerald), var(--cyan))` }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Leave summary */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Upcoming Leave Impact</div>
                        <div className="text-xs text-muted">Next 2 weeks</div>
                    </div>
                    {state.leaveEntries.slice(0, 5).map((l, i) => {
                        const member = state.teamMembers.find(m => m.id === l.memberId);
                        return (
                            <div key={i} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-8">
                                    <div className="avatar" style={{ background: AVATAR_COLORS[i % 6], width: 28, height: 28, fontSize: 10 }}>{member?.avatar}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{member?.name}</div>
                                        <div className="text-xs text-muted">{l.week} • {l.type}</div>
                                    </div>
                                </div>
                                <span style={{ background: 'var(--red-dim)', color: 'var(--red)', fontWeight: 700, padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>-{l.hoursOff}h</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
