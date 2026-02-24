import type { JiraStory, TaskStatus } from '../types/index';

export interface ResultProject {
    id: string;
    name: string;
    code: string;
    type: 'scrum' | 'kanban' | 'azure_boards';
}

export interface TransformResult {
    stories: JiraStory[];
    projects: ResultProject[];
    // Keeping single fields for backward compatibility/default selection
    projectId: string;
    projectName: string;
    projectCode: string;
    projectType: 'scrum' | 'kanban' | 'azure_boards';
}

export function transformBoardData(json: any[], defaultProjectId: string, defaultWeek: string): TransformResult {
    if (!json || json.length === 0) {
        return { stories: [], projects: [], projectId: '', projectName: '', projectCode: '', projectType: 'scrum' };
    }

    // Detect board type from columns present in the sheet
    const firstRow = json[0] || {};
    let globalType: 'scrum' | 'kanban' | 'azure_boards' = 'scrum';
    if ('Issue key' in firstRow || 'Summary' in firstRow) globalType = 'kanban';
    else if ('Work Item Type' in firstRow || 'Iteration Path' in firstRow) globalType = 'azure_boards';

    const projectMap = new Map<string, ResultProject>();

    const stories: JiraStory[] = json.map(row => {
        const id = row['Story ID'] || row['ID'] || row['Issue key'] || `TMP-${Math.floor(Math.random() * 10000)}`;
        const title = row['Title'] || row['Summary'] || 'Untitled';
        const rawStatus = String(row['Status'] || row['State'] || 'To Do').toLowerCase();

        let status: TaskStatus = 'todo';
        if (rawStatus.includes('progress') || rawStatus.includes('active') || rawStatus.includes('doing')) status = 'inprogress';
        else if (rawStatus.includes('done') || rawStatus.includes('closed') || rawStatus.includes('resolved') || rawStatus.includes('completed')) status = 'done';
        else if (rawStatus.includes('block') || rawStatus.includes('impeded')) status = 'blocked';

        // Support both "Story Points" and "Story Point" (seen in user screenshot)
        const storyPoints = Number(row['Story Points'] || row['Story Point'] || row['Effort'] || row['Estimate']) || 0;
        const sprint = row['Sprint'] || row['Iteration Path'] || 'Backlog';
        const assigneeId = row['Assignee'] || row['Assigned To'] || 'Unassigned';
        const epic = row['Epic'] || row['Area Path'] || 'General';

        // Extract Project info from THIS row
        const rProjectId = String(row['Project ID'] || defaultProjectId);
        if (!projectMap.has(rProjectId)) {
            projectMap.set(rProjectId, {
                id: rProjectId,
                name: String(row['Project Name'] || row['project name'] || 'My Project'),
                code: String(row['Project Code'] || row['project code'] || rProjectId.toUpperCase().slice(0, 8)),
                type: globalType
            });
        }

        return {
            id: String(id),
            title,
            status,
            storyPoints,
            sprint,
            assigneeId,
            epic,
            projectId: rProjectId,
            week: row['Week'] || defaultWeek,
            createdAt: new Date().toISOString(),
            description: row['Description'] || '',
            // Fallback for truncated "Acceptance" header
            acceptanceCriteria: row['Acceptance Criteria'] || row['Acceptance'] || '',
            comments: row['Comments'] || '',
            pulledDate: row['Date'] || row['Pulled Date'] || defaultWeek,
            // Fallback for truncated "Risks & Mi" header
            risksMitigation: row['Risks & Mitigation'] || row['Risks'] || row['Risks & Mi'] || '',
            blockers: row['Blockers'] || ''
        };
    });

    const projects = Array.from(projectMap.values());
    const firstP = projects[0] || { id: defaultProjectId, name: 'My Project', code: 'MP', type: globalType };

    return {
        stories,
        projects,
        projectId: firstP.id,
        projectName: firstP.name,
        projectCode: firstP.code,
        projectType: firstP.type
    };
}
