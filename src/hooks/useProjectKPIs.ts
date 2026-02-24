import { useDashboard } from '../context/DashboardContext';
import type { Sprint, JiraStory } from '../types/index';

// Compute KPIs for a project (or all projects when projectId is empty)
export function useProjectKPIs(projectId: string, week: string) {
    const { state } = useDashboard();

    const isAllProjects = !projectId;

    // When "All Projects" selected, aggregate across everything
    const project = isAllProjects ? null : state.projects.find(p => p.id === projectId);
    const sprints: Sprint[] = isAllProjects
        ? state.sprints
        : state.sprints.filter(s => s.projectId === projectId);
    const latestSprint = sprints[sprints.length - 1];

    // All stories for the scope (all projects or specific project)
    const scopeStories: JiraStory[] = isAllProjects
        ? state.jiraStories
        : state.jiraStories.filter(s => s.projectId === projectId);

    // If a specific week is selected, filter; otherwise show all
    const weekFiltered: JiraStory[] = week ? scopeStories.filter(s => s.week === week) : scopeStories;

    // Sprint velocity
    const avgVelocity = sprints.length ? Math.round(sprints.reduce((a, s) => a + s.completedPoints, 0) / sprints.length) : 0;
    const latestVelocity = latestSprint?.completedPoints ?? 0;
    const latestPlanned = latestSprint?.plannedPoints ?? 1;
    const sprintCompletion = Math.round((latestVelocity / latestPlanned) * 100);

    // Task breakdown
    const totalStories = weekFiltered.length;
    const doneStories = weekFiltered.filter(s => s.status === 'done').length;
    const blockedStories = weekFiltered.filter(s => s.status === 'blocked').length;
    const inProgressStories = weekFiltered.filter(s => s.status === 'inprogress').length;

    // Budget (aggregate across all projects when isAllProjects)
    const budgetTotal = isAllProjects
        ? state.projects.reduce((a, p) => a + (p.budget || 0), 0)
        : (project?.budget || 0);
    const budgetSpentTotal = isAllProjects
        ? state.projects.reduce((a, p) => a + (p.budgetSpent || 0), 0)
        : (project?.budgetSpent || 0);
    const budgetBurn = budgetTotal ? Math.round((budgetSpentTotal / budgetTotal) * 100) : 0;

    // Milestones
    const milestones = isAllProjects
        ? state.milestones
        : state.milestones.filter(m => m.projectId === projectId);
    const delayed = milestones.filter(m => m.status === 'delayed').length;
    const onTrack = milestones.filter(m => m.status === 'on-track').length;
    const completed = milestones.filter(m => m.status === 'completed').length;

    // Risks
    const openRisks = isAllProjects
        ? state.risks.filter(r => r.status === 'open').length
        : state.risks.filter(r => r.projectId === projectId && r.status === 'open').length;
    const criticalRisks = isAllProjects
        ? state.risks.filter(r => r.impact === 'critical' && r.status === 'open').length
        : state.risks.filter(r => r.projectId === projectId && r.impact === 'critical' && r.status === 'open').length;

    // Capacity
    const teamSize = state.teamMembers.filter(m => m.id !== 'admin0').length || 6;
    const totalCapacity = teamSize * 40;
    const leaveTaken = state.leaveEntries.filter(l => l.week === week).reduce((a, l) => a + l.hoursOff, 0);
    const availableCapacity = Math.max(1, totalCapacity - leaveTaken);
    const donePoints = weekFiltered.filter(s => s.status === 'done').reduce((a, s) => a + (s.storyPoints || 0), 0);
    const hoursWorked = Math.min(donePoints * 4, availableCapacity);
    const utilization = Math.round((hoursWorked / availableCapacity) * 100);

    // On-time delivery
    const onTimeSprints = sprints.filter(s => s.completedPoints >= s.plannedPoints).length;
    const onTimeDelivery = sprints.length ? Math.round((onTimeSprints / sprints.length) * 100) : 0;

    return {
        avgVelocity, latestVelocity, latestPlanned, sprintCompletion,
        totalStories, doneStories, blockedStories, inProgressStories,
        budgetBurn, project,
        projectLabel: isAllProjects
            ? `All Projects (${state.projects.length})`
            : project?.name ?? '',
        sprintCount: sprints.length,
        milestones: { delayed, onTrack, completed, total: milestones.length },
        risks: { open: openRisks, critical: criticalRisks },
        capacity: { total: totalCapacity, available: availableCapacity, leave: leaveTaken, utilization },
        onTimeDelivery,
        isAllProjects,
    };
}
