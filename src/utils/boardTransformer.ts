import type { JiraStory, TaskStatus } from '../types/index';

export function transformBoardData(json: any[], defaultProjectId: string, defaultWeek: string): JiraStory[] {
    return json.map(row => {
        // Handle variations of keys from Scrum, Kanban, and Azure Boards
        const id = row['Story ID'] || row['ID'] || row['Issue key'] || `TMP-${Math.floor(Math.random() * 10000)}`;
        const title = row['Title'] || row['Summary'] || 'Untitled';
        const rawStatus = String(row['Status'] || row['State'] || 'To Do').toLowerCase();

        let status: TaskStatus = 'todo';
        if (rawStatus.includes('progress') || rawStatus.includes('active') || rawStatus.includes('doing')) status = 'inprogress';
        else if (rawStatus.includes('done') || rawStatus.includes('closed') || rawStatus.includes('resolved') || rawStatus.includes('completed')) status = 'done';
        else if (rawStatus.includes('block') || rawStatus.includes('impeded')) status = 'blocked';

        const storyPoints = Number(row['Story Points'] || row['Effort'] || row['Estimate']) || 0;
        const sprint = row['Sprint'] || row['Iteration Path'] || 'Backlog';
        const assigneeId = row['Assignee'] || row['Assigned To'] || 'Unassigned';
        const epic = row['Epic'] || row['Area Path'] || 'General';

        return {
            id: String(id),
            title,
            status,
            storyPoints,
            sprint,
            assigneeId,
            epic,
            projectId: row['Project ID'] || defaultProjectId,
            week: row['Week'] || defaultWeek,
            createdAt: new Date().toISOString()
        };
    });
}
