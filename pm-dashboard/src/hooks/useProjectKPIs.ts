import { useDashboard } from '../context/DashboardContext';
import { Sprint, JiraStory } from '../types';

// Compute KPIs for a project from state
export function useProjectKPIs(projectId: string, week: string) {
    const { state } = useDashboard();
    const project = state.projects.find(p => p.id === projectId);
    const sprints: Sprint[] = state.sprints.filter(s => s.projectId === projectId);
    const latestSprint = sprints[sprints.length - 1];
    const weekStories: JiraStory[] = state.jiraStories.filter(s => s.projectId === projectId);
    const weekFiltered: JiraStory[] = weekStories.filter(s => s.week === week);

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

    // Budget
    const budgetBurn = project ? Math.round((project.budgetSpent / project.budget) * 100) : 0;

    // Milestones
    const milestones = state.milestones.filter(m => m.projectId === projectId);
    const delayed = milestones.filter(m => m.status === 'delayed').length;
    const onTrack = milestones.filter(m => m.status === 'on-track').length;
    const completed = milestones.filter(m => m.status === 'completed').length;

    // Risks
    const openRisks = state.risks.filter(r => r.projectId === projectId && r.status === 'open').length;
    const criticalRisks = state.risks.filter(r => r.projectId === projectId && r.impact === 'critical' && r.status === 'open').length;

    // Capacity
    const teamSize = state.teamMembers.filter(m => ['tm1', 'tm2', 'tm3', 'tm4', 'tm5', 'tm6'].includes(m.id)).length;
    const totalCapacity = teamSize * 40;
    const leaveTaken = state.leaveEntries.filter(l => l.week === week).reduce((a, l) => a + l.hoursOff, 0);
    const availableCapacity = totalCapacity - leaveTaken;
    const utilization = Math.round(((availableCapacity - 20) / availableCapacity) * 100);

    return {
        avgVelocity, latestVelocity, latestPlanned, sprintCompletion,
        totalStories, doneStories, blockedStories, inProgressStories,
        budgetBurn, project,
        milestones: { delayed, onTrack, completed, total: milestones.length },
        risks: { open: openRisks, critical: criticalRisks },
        capacity: { total: totalCapacity, available: availableCapacity, leave: leaveTaken, utilization },
    };
}
