import { useDashboard } from '../context/DashboardContext';
import { useProjectKPIs } from '../hooks/useProjectKPIs';
import { TrendingUp, TrendingDown, Minus, Target, Zap, DollarSign, ShieldAlert, Users, Flag, CheckCircle2, Clock, AlertOctagon } from 'lucide-react';

function KPICard({ label, value, sub, trend, trendLabel, color, icon }: {
    label: string; value: string | number; sub?: string;
    trend?: 'up' | 'down' | 'flat'; trendLabel?: string; color?: string; icon: React.ReactNode;
}) {
    const badgeClass = trend === 'up' ? 'badge-up' : trend === 'down' ? 'badge-down' : 'badge-flat';
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    return (
        <div className="kpi-card" style={{ '--accent-color': color } as React.CSSProperties}>
            <div className="flex items-center justify-between mb-4">
                <div className="kpi-label">{label}</div>
                <div style={{ color: color, opacity: 0.8 }}>{icon}</div>
            </div>
            <div className="kpi-value" style={{ color }}>{value}</div>
            {sub && <div className="kpi-sub">{sub}</div>}
            {trend && <div className={`kpi-badge ${badgeClass}`} style={{ marginTop: 8 }}><TrendIcon size={10} />{trendLabel}</div>}
        </div>
    );
}

export default function KPICards() {
    const { state } = useDashboard();
    const kpi = useProjectKPIs(state.selectedProjectId, state.selectedWeek);
    const p = kpi.project;

    const budget = p ? `$${(p.budgetSpent / 1000).toFixed(0)}K / $${(p.budget / 1000).toFixed(0)}K` : '-';

    return (
        <div>
            <div className="section-label" style={{ marginBottom: 14 }}>Key Performance Indicators — 360° View</div>
            <div className="kpi-grid">
                <KPICard label="Sprint Velocity" value={kpi.latestVelocity}
                    sub={`${kpi.avgVelocity} pts avg (${kpi.sprintCount} sprints)`}
                    trend="up" trendLabel="+4 pts vs avg" color="var(--violet-light)" icon={<Zap size={18} />} />

                <KPICard label="Sprint Completion" value={`${kpi.sprintCompletion}%`}
                    sub={`${kpi.latestVelocity} of ${kpi.latestPlanned} pts delivered`}
                    trend={kpi.sprintCompletion >= 90 ? 'up' : kpi.sprintCompletion >= 75 ? 'flat' : 'down'}
                    trendLabel={kpi.sprintCompletion >= 90 ? 'On target' : 'Below target'}
                    color="var(--cyan)" icon={<Target size={18} />} />

                <KPICard label="Budget Burn" value={`${kpi.budgetBurn}%`}
                    sub={budget}
                    trend={kpi.budgetBurn <= 55 ? 'up' : kpi.budgetBurn <= 75 ? 'flat' : 'down'}
                    trendLabel={kpi.budgetBurn <= 55 ? 'Under budget' : kpi.budgetBurn <= 75 ? 'On track' : 'Over budget'}
                    color={kpi.budgetBurn > 80 ? 'var(--red)' : kpi.budgetBurn > 65 ? 'var(--amber)' : 'var(--emerald)'}
                    icon={<DollarSign size={18} />} />

                <KPICard label="Team Utilization" value={`${kpi.capacity.utilization}%`}
                    sub={`${kpi.capacity.available}h available of ${kpi.capacity.total}h`}
                    trend={kpi.capacity.utilization >= 80 ? 'up' : 'flat'} trendLabel={`${kpi.capacity.leave}h on leave`}
                    color="var(--violet-light)" icon={<Users size={18} />} />

                <KPICard label="Blocked Stories" value={kpi.blockedStories}
                    sub={`${kpi.totalStories} total this week`}
                    trend={kpi.blockedStories === 0 ? 'up' : kpi.blockedStories <= 1 ? 'flat' : 'down'}
                    trendLabel={kpi.blockedStories === 0 ? 'No blockers' : `${kpi.blockedStories} needs attention`}
                    color={kpi.blockedStories === 0 ? 'var(--emerald)' : kpi.blockedStories <= 1 ? 'var(--amber)' : 'var(--red)'}
                    icon={<AlertOctagon size={18} />} />

                <KPICard label="Story Completion" value={`${kpi.totalStories ? Math.round((kpi.doneStories / kpi.totalStories) * 100) : 0}%`}
                    sub={`${kpi.doneStories} done of ${kpi.totalStories} stories`}
                    trend="up" trendLabel={`${kpi.inProgressStories} in progress`}
                    color="var(--emerald)" icon={<CheckCircle2 size={18} />} />

                <KPICard label="Open Risks" value={kpi.risks.open}
                    sub={`${kpi.risks.critical} critical severity`}
                    trend={kpi.risks.open === 0 ? 'up' : kpi.risks.critical > 0 ? 'down' : 'flat'}
                    trendLabel={kpi.risks.critical > 0 ? 'Critical risks open' : 'No critical risks'}
                    color={kpi.risks.critical > 0 ? 'var(--red)' : kpi.risks.open > 2 ? 'var(--amber)' : 'var(--emerald)'}
                    icon={<ShieldAlert size={18} />} />

                <KPICard label="Milestones" value={`${kpi.milestones.completed}/${kpi.milestones.total}`}
                    sub={`${kpi.milestones.onTrack} on-track • ${kpi.milestones.delayed} delayed`}
                    trend={kpi.milestones.delayed === 0 ? 'up' : kpi.milestones.delayed <= 1 ? 'flat' : 'down'}
                    trendLabel={kpi.milestones.delayed === 0 ? 'All on schedule' : `${kpi.milestones.delayed} delayed`}
                    color={kpi.milestones.delayed > 1 ? 'var(--red)' : kpi.milestones.delayed === 1 ? 'var(--amber)' : 'var(--emerald)'}
                    icon={<Flag size={18} />} />

                <KPICard label="On-Time Delivery" value="87%"
                    sub="Last 12 sprints rolling" trend="up" trendLabel="+2% vs last month"
                    color="var(--cyan)" icon={<Clock size={18} />} />
            </div>
        </div>
    );
}
