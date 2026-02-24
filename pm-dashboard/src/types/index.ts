export type Persona = 'tpm' | 'director' | 'developer';

export type RAGStatus = 'green' | 'amber' | 'red';
export type TaskStatus = 'todo' | 'inprogress' | 'done' | 'blocked';
export type MilestoneStatus = 'on-track' | 'at-risk' | 'delayed' | 'completed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    avatar: string;
    email: string;
    totalHoursPerWeek: number;
}

export interface LeaveEntry {
    memberId: string;
    week: string; // YYYY-Www
    hoursOff: number;
    type: 'vacation' | 'sick' | 'holiday' | 'wfh';
}

export interface JiraStory {
    id: string;
    title: string;
    assigneeId: string;
    storyPoints: number;
    status: TaskStatus;
    epic: string;
    sprint: string;
    week: string; // YYYY-Www
    projectId: string;
}

export interface Milestone {
    id: string;
    projectId: string;
    title: string;
    targetDate: string; // ISO date
    actualDate?: string;
    status: MilestoneStatus;
    description: string;
}

export interface Project {
    id: string;
    name: string;
    code: string;
    ownerId: string;
    status: MilestoneStatus;
    ragStatus: RAGStatus;
    startDate: string;
    endDate: string;
    budget: number;
    budgetSpent: number;
    description: string;
}

export interface Sprint {
    id: string;
    projectId: string;
    name: string;
    startDate: string;
    endDate: string;
    plannedPoints: number;
    completedPoints: number;
    week: string;
}

export interface RiskItem {
    id: string;
    projectId: string;
    title: string;
    description: string;
    probability: RiskLevel;
    impact: RiskLevel;
    mitigation: string;
    ownerId: string;
    status: 'open' | 'mitigated' | 'closed';
}

export interface WeeklyReport {
    id: string;
    projectId: string;
    week: string; // YYYY-Www
    ragStatus: RAGStatus;
    accomplishments: string;
    nextWeekPlan: string;
    blockers: string;
    preparedBy: string;
    approvedBy?: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    approvalComment?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CapacityData {
    memberId: string;
    week: string;
    totalHours: number;
    leaveHours: number;
    availableHours: number;
    allocatedHours: number;
}

export interface DashboardState {
    persona: Persona;
    selectedWeek: string;
    selectedProjectId: string;
    projects: Project[];
    teamMembers: TeamMember[];
    jiraStories: JiraStory[];
    milestones: Milestone[];
    sprints: Sprint[];
    risks: RiskItem[];
    leaveEntries: LeaveEntry[];
    weeklyReports: WeeklyReport[];
}
