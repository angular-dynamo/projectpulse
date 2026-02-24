const db = require('./db');

const teamMembers = [
    { id: 'tm1', name: 'Priya Sharma', role: 'Frontend Lead', appRole: 'admin', avatar: 'PS', email: 'priya@acme.com', totalHoursPerWeek: 40 },
    { id: 'tm2', name: 'Rahul Verma', role: 'Backend Engineer', appRole: 'developer', avatar: 'RV', email: 'rahul@acme.com', totalHoursPerWeek: 40 },
    { id: 'tm3', name: 'Aisha Khan', role: 'QA Engineer', appRole: 'developer', avatar: 'AK', email: 'aisha@acme.com', totalHoursPerWeek: 40 },
    { id: 'tm4', name: 'Sam Chen', role: 'DevOps', appRole: 'developer', avatar: 'SC', email: 'sam@acme.com', totalHoursPerWeek: 40 },
    { id: 'tm5', name: 'Elena Rossi', role: 'Designer', appRole: 'developer', avatar: 'ER', email: 'elena@acme.com', totalHoursPerWeek: 40 },
    { id: 'tm6', name: 'Kavita Singh', role: 'Technical Program Manager', appRole: 'tpm', avatar: 'KS', email: 'kavita@acme.com', totalHoursPerWeek: 40 },
];

const projects = [
    {
        id: 'proj1', name: 'Project Pulse (360 Dashboard)', code: 'PRJ-PLS', ownerId: 'tm1',
        status: 'on-track', ragStatus: 'green', startDate: '2026-01-05', endDate: '2026-06-30',
        budget: 250000, budgetSpent: 145000, description: 'Internal dashboard for PM 360 view.',
        projectType: 'scrum'
    },
    {
        id: 'proj2', name: 'Titan Infrastructure Upgrade', code: 'TITN-INF', ownerId: 'tm4',
        status: 'at-risk', ragStatus: 'amber', startDate: '2025-11-01', endDate: '2026-04-15',
        budget: 1200000, budgetSpent: 850000, description: 'Cloud migration and DB optimization.',
        projectType: 'kanban'
    }
];

const milestones = [
    { id: 'ms1', projectId: 'proj1', title: 'Design Finalized', targetDate: '2026-02-15', actualDate: '2026-02-12', status: 'completed', description: 'UI/UX designs approved.' },
    { id: 'ms2', projectId: 'proj1', title: 'Beta Launch', targetDate: '2026-03-20', actualDate: '', status: 'on-track', description: 'Initial feature set release.' },
    { id: 'ms3', projectId: 'proj2', title: 'Data Migration', targetDate: '2026-02-28', actualDate: '', status: 'at-risk', description: 'Migrate legacy SQL to Postgres.' },
];

const risks = [
    { id: 'risk1', projectId: 'proj1', title: 'Excel API Complexity', description: 'Parsing complex xlsx might delay dev dashboard.', probability: 'medium', impact: 'high', mitigation: 'Use SheetJS and pre-defined templates.', ownerId: 'tm1', status: 'mitigated' },
    { id: 'risk2', projectId: 'proj2', title: 'Vendor Delay', description: 'Cloud vendor hardware shortage.', probability: 'high', impact: 'critical', mitigation: 'Engage alternative cloud region.', ownerId: 'tm4', status: 'open' },
];

const sprints = [
    { id: 'sp1', projectId: 'proj1', name: 'Sprint 1', startDate: '2026-01-05', endDate: '2026-01-18', plannedPoints: 40, completedPoints: 38, week: '2026-W01' },
    { id: 'sp2', projectId: 'proj1', name: 'Sprint 2', startDate: '2026-01-19', endDate: '2026-02-01', plannedPoints: 42, completedPoints: 45, week: '2026-W03' },
    { id: 'sp3', projectId: 'proj1', name: 'Sprint 3', startDate: '2026-02-02', endDate: '2026-02-15', plannedPoints: 38, completedPoints: 35, week: '2026-W05' },
    { id: 'sp4', projectId: 'proj1', name: 'Sprint 4', startDate: '2026-02-16', endDate: '2026-03-01', plannedPoints: 45, completedPoints: 20, week: '2026-W07' },
];

const jiraStories = [
    { id: 'JIRA-101', title: 'Core Layout Implementation', assigneeId: 'tm2', storyPoints: 5, status: 'done', epic: 'UI Shell', sprint: 'sp1', week: '2026-W01', projectId: 'proj1', createdAt: '2026-01-02', completedAt: '2026-01-10' },
    { id: 'JIRA-102', title: 'Persona Switcher Logic', assigneeId: 'tm1', storyPoints: 3, status: 'done', epic: 'UI Shell', sprint: 'sp1', week: '2026-W02', projectId: 'proj1', createdAt: '2026-01-03', completedAt: '2026-01-14' },
    { id: 'JIRA-103', title: 'KPI Card Components', assigneeId: 'tm1', storyPoints: 8, status: 'done', epic: 'TPM View', sprint: 'sp2', week: '2026-W03', projectId: 'proj1', createdAt: '2026-01-15', completedAt: '2026-01-25' },
    { id: 'JIRA-104', title: 'Chart Data Binding', assigneeId: 'tm2', storyPoints: 5, status: 'done', epic: 'TPM View', sprint: 'sp2', week: '2026-W04', projectId: 'proj1', createdAt: '2026-01-16', completedAt: '2026-01-28' },
    { id: 'JIRA-105', title: 'Weekly Report Form', assigneeId: 'tm1', storyPoints: 5, status: 'inprogress', epic: 'TPM View', sprint: 'sp3', week: '2026-W05', projectId: 'proj1', createdAt: '2026-02-01' },
    { id: 'JIRA-106', title: 'Gantt CSS Cleanup', assigneeId: 'tm3', storyPoints: 2, status: 'inprogress', epic: 'TPM View', sprint: 'sp3', week: '2026-W06', projectId: 'proj1', createdAt: '2026-02-05' },
    { id: 'JIRA-107', title: 'Risk Heatmap UI', assigneeId: 'tm5', storyPoints: 3, status: 'todo', epic: 'Risks', sprint: 'sp4', week: '2026-W07', projectId: 'proj1', createdAt: '2026-02-08' },
    { id: 'JIRA-108', title: 'Excel Parser Backend', assigneeId: 'tm2', storyPoints: 8, status: 'blocked', epic: 'Dev View', sprint: 'sp4', week: '2026-W07', projectId: 'proj1', createdAt: '2026-02-10' },
];

const leaveEntries = [
    { id: 'lv1', memberId: 'tm1', week: '2026-W07', hoursOff: 16, type: 'vacation' },
    { id: 'lv2', memberId: 'tm3', week: '2026-W07', hoursOff: 8, type: 'sick' },
];

const weeklyReports = [
    { id: 'wr-1', projectId: 'proj1', week: '2026-W05', ragStatus: 'green', accomplishments: 'Sprint 2 closed. KPI cards done.', nextWeekPlan: 'Sprint 3 start. Gantt charts.', blockers: 'None', preparedBy: 'Kavita Singh', approvedBy: 'Director Phil', status: 'approved', createdAt: '2026-02-06T10:00:00Z', updatedAt: '2026-02-07T14:00:00Z' },
    { id: 'wr-2', projectId: 'proj1', week: '2026-W06', ragStatus: 'green', accomplishments: 'Gantt chart rendering logic finished.', nextWeekPlan: 'Capacity planning view.', blockers: 'Risk 1 mitigation needed.', preparedBy: 'Kavita Singh', approvedBy: '', status: 'submitted', createdAt: '2026-02-13T09:00:00Z', updatedAt: '2026-02-13T09:00:00Z' },
];

const seedTable = (table, data) => {
    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(',');
    const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;

    db.serialize(() => {
        const stmt = db.prepare(sql);
        data.forEach(row => {
            const values = columns.map(c => row[c] !== undefined ? row[c] : null);
            stmt.run(values);
        });
        stmt.finalize();
    });
};

console.log('Seeding database...');
db.serialize(() => {
    seedTable('team_members', teamMembers);
    seedTable('projects', projects);
    seedTable('milestones', milestones);
    seedTable('risks', risks);
    seedTable('sprints', sprints);
    seedTable('jira_stories', jiraStories);
    seedTable('leave_entries', leaveEntries);
    seedTable('weekly_reports', weeklyReports);
});

setTimeout(() => {
    console.log('Database seeded successfully.');
    db.close();
    process.exit(0);
}, 2000);
