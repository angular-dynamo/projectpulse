import { useDashboard } from '../context/DashboardContext';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';

const COLORS = { done: '#10b981', inprogress: '#6d6cff', todo: '#4a5578', blocked: '#ef4444' };

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                {label && <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>}
                {payload.map((p: any, i: number) => (
                    <div key={i} style={{ color: p.color || p.fill, display: 'flex', gap: 8 }}>
                        <span>{p.name}:</span><span style={{ fontWeight: 700 }}>{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function TaskProgressCharts() {
    const { state } = useDashboard();
    const stories = state.jiraStories.filter(s => s.projectId === state.selectedProjectId);
    const allSprints = state.sprints.filter(s => s.projectId === state.selectedProjectId);

    // Donut data
    const done = stories.filter(s => s.status === 'done').length;
    const inprogress = stories.filter(s => s.status === 'inprogress').length;
    const todo = stories.filter(s => s.status === 'todo').length;
    const blocked = stories.filter(s => s.status === 'blocked').length;
    const donutData = [
        { name: 'Done', value: done, color: COLORS.done },
        { name: 'In Progress', value: inprogress, color: COLORS.inprogress },
        { name: 'To Do', value: todo, color: COLORS.todo },
        { name: 'Blocked', value: blocked, color: COLORS.blocked },
    ].filter(d => d.value > 0);

    // Velocity trend
    const velocityData = allSprints.map(s => ({
        name: s.name, Planned: s.plannedPoints, Completed: s.completedPoints,
    }));

    // Burndown (cumulative)
    let cumPlanned = 0, cumCompleted = 0;
    const burnData = allSprints.map(s => {
        cumPlanned += s.plannedPoints;
        cumCompleted += s.completedPoints;
        return { name: s.name, Planned: cumPlanned, Completed: cumCompleted };
    });

    // Epic breakdown from current week
    const weekStories = stories.filter(s => s.week === state.selectedWeek);
    const epicMap: Record<string, number> = {};
    weekStories.forEach(s => { epicMap[s.epic] = (epicMap[s.epic] || 0) + s.storyPoints; });
    const epicData = Object.entries(epicMap).map(([epic, pts]) => ({ epic, pts }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-label">Task Progress & Velocity</div>

            <div className="charts-grid">
                {/* Donut */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Story Status Distribution</div>
                        <div className="text-xs text-muted">{stories.length} total stories</div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                                dataKey="value" paddingAngle={3}>
                                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Velocity Bar */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Sprint Velocity</div>
                        <div className="text-xs text-muted">Planned vs Completed (pts)</div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={velocityData} barGap={2} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Planned" fill="rgba(109,108,255,0.3)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Completed" fill="#6d6cff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Burndown Area */}
                <div className="card chart-full">
                    <div className="card-header">
                        <div className="card-title">Cumulative Story Points — Planned vs Completed</div>
                        <div className="text-xs text-muted">All sprints</div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={burnData}>
                            <defs>
                                <linearGradient id="gradPlan" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6d6cff" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6d6cff" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="Planned" stroke="#6d6cff" fill="url(#gradPlan)" strokeWidth={2} />
                            <Area type="monotone" dataKey="Completed" stroke="#10b981" fill="url(#gradComp)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Epic distribution */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Story Points by Epic</div>
                        <div className="text-xs text-muted">{state.selectedWeek}</div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={epicData} layout="vertical" barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                            <YAxis dataKey="epic" type="category" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={80} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="pts" fill="#22d3ee" radius={[0, 4, 4, 0]}>
                                {epicData.map((_, i) => {
                                    const cols = ['#6d6cff', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#a78bfa'];
                                    return <Cell key={i} fill={cols[i % cols.length]} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Story table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Stories This Week</div>
                        <div className="text-xs text-muted">{weekStories.length} stories</div>
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                        <table className="data-table">
                            <thead><tr><th>ID</th><th>Title</th><th>SP</th><th>Status</th></tr></thead>
                            <tbody>
                                {weekStories.map(s => (
                                    <tr key={s.id}>
                                        <td><span className="text-violet font-semibold">{s.id}</span></td>
                                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{s.title}</td>
                                        <td><span style={{ fontWeight: 700, color: 'var(--cyan)' }}>{s.storyPoints}</span></td>
                                        <td><span className={`status-pill pill-${s.status}`}>{s.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
