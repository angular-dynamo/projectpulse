import { useDashboard } from '../context/DashboardContext';
import type { Milestone } from '../types/index';
import { format, parseISO, differenceInDays, startOfYear, isValid } from 'date-fns';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const YEAR = 2026;
const YEAR_START = new Date(YEAR, 0, 1);
const CHART_DAYS = 181; // Approx 6 months

const STATUS_COLORS: Record<string, string> = {
    'on-track': '#10b981',
    'at-risk': '#f59e0b',
    'delayed': '#ef4444',
    'completed': '#22d3ee',
};

function dayOffset(dateStr: string) {
    const d = parseISO(dateStr);
    return differenceInDays(d, YEAR_START);
}

function MilestoneRow({ milestone, totalWidth }: { milestone: Milestone; totalWidth: number }) {
    const actualDateObj = milestone.actualDate ? parseISO(milestone.actualDate) : null;
    const prevOffset = actualDateObj && isValid(actualDateObj)
        ? (dayOffset(milestone.actualDate!) / CHART_DAYS) * totalWidth
        : null;

    const barStart = milestone.targetDate ? (dayOffset(milestone.targetDate) / CHART_DAYS) * totalWidth : 0;
    const color = STATUS_COLORS[milestone.status] || '#ccc';

    return (
        <g>
            {/* Diamond milestone marker */}
            <polygon
                points={`${barStart},10 ${barStart + 7},17 ${barStart},24 ${barStart - 7},17`}
                fill={color}
                opacity={0.9}
                style={{ cursor: 'pointer' }}
            />
            {/* Actual date line if delayed */}
            {prevOffset && prevOffset !== barStart && (
                <>
                    <line x1={prevOffset} y1={17} x2={barStart} y2={17} stroke={color} strokeWidth={1.5} strokeDasharray="4 2" opacity={0.5} />
                    <circle cx={prevOffset} cy={17} r={4} fill={color} opacity={0.5} />
                </>
            )}
        </g>
    );
}

export default function GanttChart() {
    const { state } = useDashboard();
    const milestones = state.milestones.filter(m => m.projectId === state.selectedProjectId);
    const project = state.projects.find(p => p.id === state.selectedProjectId);

    const SVG_W = 1200;
    const ROW_H = 44;
    const LABEL_W = 320;
    const CHART_W = SVG_W - LABEL_W;
    const HEADER_H = 32;

    // Today line
    const todayOffset = (differenceInDays(new Date(), YEAR_START) / CHART_DAYS) * CHART_W;
    const projectStart = project?.startDate ? (dayOffset(project.startDate) / CHART_DAYS) * CHART_W : 0;
    const projectEnd = project?.endDate ? (dayOffset(project.endDate) / CHART_DAYS) * CHART_W : CHART_W;

    const totalH = HEADER_H + ROW_H * milestones.length + 24;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-label">Milestone Gantt Chart — {YEAR}</div>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">📅 {project?.name} — Milestone Timeline</div>
                    <div className="flex gap-12">
                        {Object.entries(STATUS_COLORS).map(([s, c]) => (
                            <span key={s} className="text-xs" style={{ color: c, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width={10} height={10}><polygon points="5,0 10,5 5,10 0,5" fill={c} /></svg>
                                {s}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="gantt-wrapper">
                    <svg width={SVG_W} height={totalH} style={{ minWidth: SVG_W }}>
                        {/* Month grid */}
                        {MONTH_LABELS.map((m, i) => {
                            const x = LABEL_W + (i / 6) * CHART_W;
                            return (
                                <g key={m}>
                                    <line x1={x} y1={HEADER_H} x2={x} y2={totalH} stroke="rgba(255,255,255,0.05)" />
                                    <text x={x + (CHART_W / 12)} y={20} fill="var(--text-muted)" fontSize={10} textAnchor="middle">{m}</text>
                                </g>
                            );
                        })}

                        {/* Project bar (background) */}
                        <rect x={LABEL_W + projectStart} y={HEADER_H + 6} width={projectEnd - projectStart} height={totalH - HEADER_H - 12}
                            fill="rgba(109,108,255,0.05)" rx={4} />

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
                            const color = STATUS_COLORS[ms.status];
                            const targetObj = ms.targetDate ? parseISO(ms.targetDate) : null;
                            const dateLabel = targetObj && isValid(targetObj) ? format(targetObj, 'MMM d') : '';
                            return (
                                <g key={ms.id}>
                                    {/* Row background (alternating) */}
                                    {i % 2 === 0 && (
                                        <rect x={0} y={y} width={SVG_W} height={ROW_H} fill="rgba(255,255,255,0.015)" />
                                    )}
                                    {/* Label */}
                                    <text x={8} y={y + 20} fill="var(--text-primary)" fontSize={11} fontWeight={600} style={{ fontFamily: 'Inter,sans-serif' }}>
                                        {ms.title.length > 26 ? ms.title.slice(0, 26) + '…' : ms.title}
                                    </text>
                                    <text x={8} y={y + 34} fill="var(--text-muted)" fontSize={9} style={{ fontFamily: 'Inter,sans-serif' }}>
                                        {dateLabel}
                                        {ms.actualDate && isValid(parseISO(ms.actualDate)) ? ` → actual: ${format(parseISO(ms.actualDate), 'MMM d')}` : ''}
                                    </text>

                                    {/* Status pill */}
                                    <rect x={LABEL_W - 70} y={y + 12} width={64} height={16} rx={8} fill={`${color}22`} />
                                    <text x={LABEL_W - 38} y={y + 24} fill={color} fontSize={9} textAnchor="middle" fontWeight={700}>
                                        {ms.status.toUpperCase()}
                                    </text>

                                    {/* Timeline milestone marker */}
                                    <g transform={`translate(${LABEL_W}, ${y})`}>
                                        <MilestoneRow milestone={ms} totalWidth={CHART_W} />
                                    </g>

                                    {/* Date label */}
                                    <text x={LABEL_W + (ms.targetDate ? (dayOffset(ms.targetDate) / CHART_DAYS) * CHART_W : 0) + 10}
                                        y={y + 18} fill="var(--text-muted)" fontSize={8} style={{ fontFamily: 'Inter,sans-serif' }}>
                                        {dateLabel}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}
