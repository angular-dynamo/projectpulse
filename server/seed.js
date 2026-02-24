// seed.js — exported seeder function, called only when user enables "Load Mock Data" on login
module.exports = function seedDatabase(db, callback) {
    const projects = [
        { id: 'proj1', name: 'Customer Portal Redesign', code: 'CPR', ownerId: 'tpm1', projectType: 'scrum', status: 'on-track', ragStatus: 'green', startDate: '2026-01-05', endDate: '2026-06-30', budget: 450000, budgetSpent: 178000, description: 'Complete redesign of the customer-facing portal with new UX and microservices backend.' },
        { id: 'proj2', name: 'Data Analytics Platform', code: 'DAP', ownerId: 'tpm1', projectType: 'kanban', status: 'at-risk', ragStatus: 'amber', startDate: '2026-01-12', endDate: '2026-08-31', budget: 620000, budgetSpent: 310000, description: 'Real-time analytics and reporting platform with ML-driven insights.' },
        { id: 'proj3', name: 'Mobile App V2', code: 'MAV2', ownerId: 'tpm1', projectType: 'azure_boards', status: 'delayed', ragStatus: 'red', startDate: '2025-11-01', endDate: '2026-04-30', budget: 280000, budgetSpent: 195000, description: 'Second major version of the mobile application with offline-first architecture.' },
    ];
    const teamMembers = [
        { id: 'tm1', name: 'Priya Sharma', role: 'Frontend Lead', appRole: 'developer', avatar: 'PS', email: 'priya@acme.com', totalHoursPerWeek: 40 },
        { id: 'tm2', name: 'Rahul Verma', role: 'Backend Engineer', appRole: 'developer', avatar: 'RV', email: 'rahul@acme.com', totalHoursPerWeek: 40 },
        { id: 'tm3', name: 'Sarah Chen', role: 'QA Engineer', appRole: 'developer', avatar: 'SC', email: 'sarah@acme.com', totalHoursPerWeek: 40 },
        { id: 'tm4', name: 'James Wilson', role: 'DevOps Engineer', appRole: 'developer', avatar: 'JW', email: 'james@acme.com', totalHoursPerWeek: 40 },
        { id: 'tm5', name: 'Meera Nair', role: 'Full Stack Dev', appRole: 'developer', avatar: 'MN', email: 'meera@acme.com', totalHoursPerWeek: 40 },
        { id: 'tm6', name: 'Alex Thompson', role: 'Tech Lead', appRole: 'developer', avatar: 'AT', email: 'alex@acme.com', totalHoursPerWeek: 40 },
        { id: 'tpm1', name: 'Kavita Singh', role: 'TPM', appRole: 'tpm', avatar: 'KS', email: 'kavita@acme.com', totalHoursPerWeek: 40 },
        { id: 'dir1', name: 'David Park', role: 'Director of Engineering', appRole: 'director', avatar: 'DP', email: 'david@acme.com', totalHoursPerWeek: 40 },
    ];
    const milestones = [
        { id: 'ms1', projectId: 'proj1', title: 'Design System Complete', targetDate: '2026-02-28', actualDate: '2026-02-25', status: 'completed', description: 'All UI components and design tokens finalized', startDate: '2026-01-05' },
        { id: 'ms2', projectId: 'proj1', title: 'Alpha Release', targetDate: '2026-03-31', status: 'on-track', description: 'Internal alpha with core features', startDate: '2026-02-01' },
        { id: 'ms3', projectId: 'proj1', title: 'Beta Launch', targetDate: '2026-05-15', status: 'on-track', description: 'Beta to 500 selected customers', startDate: '2026-04-01' },
        { id: 'ms4', projectId: 'proj1', title: 'GA Release', targetDate: '2026-06-30', status: 'on-track', description: 'General availability release', startDate: '2026-06-01' },
        { id: 'ms5', projectId: 'proj2', title: 'Data Ingestion Pipeline', targetDate: '2026-02-15', actualDate: '2026-02-22', status: 'delayed', description: 'ETL pipelines for all data sources', startDate: '2026-01-12' },
        { id: 'ms6', projectId: 'proj2', title: 'Dashboard v1', targetDate: '2026-04-30', status: 'at-risk', description: 'Core analytics dashboards', startDate: '2026-03-01' },
        { id: 'ms7', projectId: 'proj2', title: 'ML Models Integration', targetDate: '2026-07-15', status: 'on-track', description: 'Predictive models live in production', startDate: '2026-06-01' },
        { id: 'ms8', projectId: 'proj2', title: 'Enterprise GA', targetDate: '2026-08-31', status: 'on-track', description: 'Full enterprise release', startDate: '2026-08-01' },
        { id: 'ms9', projectId: 'proj3', title: 'iOS Beta', targetDate: '2026-01-31', actualDate: '2026-02-14', status: 'delayed', description: 'iOS beta on TestFlight', startDate: '2025-11-01' },
        { id: 'ms10', projectId: 'proj3', title: 'Android Beta', targetDate: '2026-02-28', status: 'at-risk', description: 'Android beta on Play Store', startDate: '2025-12-01' },
        { id: 'ms11', projectId: 'proj3', title: 'App Store Release', targetDate: '2026-04-30', status: 'delayed', description: 'Public release on both stores', startDate: '2026-03-01' },
    ];
    const sprints = [
        { id: 'sp1', projectId: 'proj1', name: 'Sprint 1', startDate: '2026-01-05', endDate: '2026-01-18', plannedPoints: 42, completedPoints: 40, week: '2026-W02' },
        { id: 'sp2', projectId: 'proj1', name: 'Sprint 2', startDate: '2026-01-19', endDate: '2026-02-01', plannedPoints: 45, completedPoints: 43, week: '2026-W04' },
        { id: 'sp3', projectId: 'proj1', name: 'Sprint 3', startDate: '2026-02-02', endDate: '2026-02-15', plannedPoints: 48, completedPoints: 46, week: '2026-W06' },
        { id: 'sp4', projectId: 'proj1', name: 'Sprint 4', startDate: '2026-02-16', endDate: '2026-03-01', plannedPoints: 50, completedPoints: 39, week: '2026-W08' },
        { id: 'sp5', projectId: 'proj2', name: 'Sprint 1', startDate: '2026-01-12', endDate: '2026-01-25', plannedPoints: 38, completedPoints: 30, week: '2026-W03' },
        { id: 'sp6', projectId: 'proj2', name: 'Sprint 2', startDate: '2026-01-26', endDate: '2026-02-08', plannedPoints: 40, completedPoints: 28, week: '2026-W05' },
        { id: 'sp7', projectId: 'proj2', name: 'Sprint 3', startDate: '2026-02-09', endDate: '2026-02-22', plannedPoints: 42, completedPoints: 35, week: '2026-W07' },
        { id: 'sp8', projectId: 'proj3', name: 'Sprint 1', startDate: '2025-11-03', endDate: '2025-11-16', plannedPoints: 35, completedPoints: 32, week: '2025-W46' },
        { id: 'sp9', projectId: 'proj3', name: 'Sprint 2', startDate: '2025-11-17', endDate: '2025-11-30', plannedPoints: 38, completedPoints: 25, week: '2025-W48' },
        { id: 'sp10', projectId: 'proj3', name: 'Sprint 3', startDate: '2025-12-01', endDate: '2025-12-14', plannedPoints: 36, completedPoints: 22, week: '2025-W50' },
        { id: 'sp11', projectId: 'proj3', name: 'Sprint 4', startDate: '2025-12-15', endDate: '2026-01-04', plannedPoints: 32, completedPoints: 28, week: '2025-W52' },
        { id: 'sp12', projectId: 'proj3', name: 'Sprint 5', startDate: '2026-01-05', endDate: '2026-01-18', plannedPoints: 34, completedPoints: 26, week: '2026-W02' },
        { id: 'sp13', projectId: 'proj3', name: 'Sprint 6', startDate: '2026-01-19', endDate: '2026-02-01', plannedPoints: 36, completedPoints: 31, week: '2026-W04' },
        { id: 'sp14', projectId: 'proj3', name: 'Sprint 7', startDate: '2026-02-02', endDate: '2026-02-15', plannedPoints: 34, completedPoints: 28, week: '2026-W07' },
    ];
    const jiraStories = [
        { id: 'CPR-101', title: 'Dashboard layout responsive fix', assigneeId: 'tm1', storyPoints: 5, status: 'done', epic: 'Dashboard', sprint: 'Sprint 4', week: '2026-W08', projectId: 'proj1', description: 'Fix responsive breakpoints for all screen sizes', acceptanceCriteria: 'Works on mobile, tablet and desktop', risksMitigation: '', blockers: '' },
        { id: 'CPR-102', title: 'User profile API integration', assigneeId: 'tm2', storyPoints: 8, status: 'done', epic: 'User Management', sprint: 'Sprint 4', week: '2026-W08', projectId: 'proj1', description: 'Integrate user profile read/write API', acceptanceCriteria: 'Profile saves and loads correctly', risksMitigation: 'API rate limits - cache responses', blockers: '' },
        { id: 'CPR-103', title: 'Notification system backend', assigneeId: 'tm2', storyPoints: 8, status: 'inprogress', epic: 'Notifications', sprint: 'Sprint 4', week: '2026-W08', projectId: 'proj1', description: 'Build event-driven notification backend', acceptanceCriteria: 'Notifications delivered within 2s', risksMitigation: '', blockers: 'Needs queue infrastructure provisioned' },
        { id: 'CPR-104', title: 'E2E test coverage for auth flow', assigneeId: 'tm3', storyPoints: 5, status: 'done', epic: 'Auth', sprint: 'Sprint 4', week: '2026-W08', projectId: 'proj1', description: 'Playwright E2E tests for login/logout/reset', acceptanceCriteria: '96% coverage on auth flows', risksMitigation: '', blockers: '' },
        { id: 'CPR-105', title: 'CI/CD pipeline optimization', assigneeId: 'tm4', storyPoints: 3, status: 'done', epic: 'DevOps', sprint: 'Sprint 4', week: '2026-W08', projectId: 'proj1', description: 'Reduce build time by parallelizing steps', acceptanceCriteria: 'Build time under 5 minutes', risksMitigation: '', blockers: '' },
        { id: 'CPR-106', title: 'Settings page - account section', assigneeId: 'tm5', storyPoints: 5, status: 'done', epic: 'Settings', sprint: 'Sprint 4', week: '2026-W08', projectId: 'proj1', description: 'Implement account management settings', acceptanceCriteria: 'User can update name, email, password', risksMitigation: '', blockers: '' },
        { id: 'CPR-107', title: 'Search feature with filters', assigneeId: 'tm1', storyPoints: 8, status: 'blocked', epic: 'Search', sprint: 'Sprint 4', week: '2026-W08', projectId: 'proj1', description: 'Full-text search with facet filters', acceptanceCriteria: 'Search returns results in <200ms', risksMitigation: 'Elasticsearch dependency - consider fallback', blockers: 'Elasticsearch cluster not provisioned yet' },
        { id: 'CPR-108', title: 'Performance audit & fixes', assigneeId: 'tm6', storyPoints: 5, status: 'done', epic: 'Performance', sprint: 'Sprint 4', week: '2026-W08', projectId: 'proj1', description: 'Lighthouse audit and critical fixes', acceptanceCriteria: 'Score above 90 on all metrics', risksMitigation: '', blockers: '' },
        { id: 'DAP-201', title: 'Kafka stream connector setup', assigneeId: 'tm2', storyPoints: 8, status: 'done', epic: 'Data Ingestion', sprint: 'Sprint 3', week: '2026-W07', projectId: 'proj2', description: 'Configure Kafka consumer for all data sources', acceptanceCriteria: 'Streams 10k events/sec without lag', risksMitigation: '', blockers: '' },
        { id: 'DAP-202', title: 'Chart library integration', assigneeId: 'tm1', storyPoints: 5, status: 'done', epic: 'Visualization', sprint: 'Sprint 3', week: '2026-W07', projectId: 'proj2', description: 'Integrate Recharts with theme support', acceptanceCriteria: 'All 5 chart types render correctly', risksMitigation: '', blockers: '' },
        { id: 'DAP-203', title: 'User permissions for dashboards', assigneeId: 'tm5', storyPoints: 8, status: 'inprogress', epic: 'User Management', sprint: 'Sprint 3', week: '2026-W07', projectId: 'proj2', description: 'Role-based access for dashboard views', acceptanceCriteria: 'Admin/viewer roles enforced', risksMitigation: 'Security review needed before release', blockers: 'Waiting for security review sign-off' },
        { id: 'DAP-204', title: 'Data export to CSV/Excel', assigneeId: 'tm3', storyPoints: 3, status: 'done', epic: 'Export', sprint: 'Sprint 3', week: '2026-W07', projectId: 'proj2', description: 'One-click export from any dashboard', acceptanceCriteria: 'Exports 100k rows without timeout', risksMitigation: '', blockers: '' },
        { id: 'DAP-205', title: 'Database query optimization', assigneeId: 'tm6', storyPoints: 5, status: 'done', epic: 'Performance', sprint: 'Sprint 3', week: '2026-W07', projectId: 'proj2', description: 'Index tuning and query rewrites', acceptanceCriteria: 'p95 queries below 250ms', risksMitigation: '', blockers: '' },
        { id: 'DAP-206', title: 'Alert thresholds configuration', assigneeId: 'tm2', storyPoints: 3, status: 'blocked', epic: 'Alerts', sprint: 'Sprint 3', week: '2026-W07', projectId: 'proj2', description: 'UI to configure metric alert thresholds', acceptanceCriteria: 'Alerts fire within 60s of threshold breach', risksMitigation: 'Architecture review pending', blockers: 'Needs architecture decision on alerting engine' },
        { id: 'DAP-207', title: 'ML model result display', assigneeId: 'tm5', storyPoints: 5, status: 'todo', epic: 'ML', sprint: 'Sprint 3', week: '2026-W07', projectId: 'proj2', description: 'Show ML prediction results on dashboard', acceptanceCriteria: 'Predictions refresh every 5 minutes', risksMitigation: '', blockers: '' },
        { id: 'MAV2-301', title: 'Offline sync mechanism', assigneeId: 'tm5', storyPoints: 13, status: 'inprogress', epic: 'Offline Mode', sprint: 'Sprint 7', week: '2026-W07', projectId: 'proj3', description: 'Implement CRDTs for conflict-free offline sync', acceptanceCriteria: 'Data syncs within 10s of reconnection', risksMitigation: 'Conflict resolution complexity - spike needed', blockers: 'Conflict resolution design not finalized' },
        { id: 'MAV2-302', title: 'Push notification service', assigneeId: 'tm2', storyPoints: 8, status: 'done', epic: 'Notifications', sprint: 'Sprint 7', week: '2026-W07', projectId: 'proj3', description: 'FCM/APNs push notifications', acceptanceCriteria: 'Notifications delivered to 99% of devices', risksMitigation: '', blockers: '' },
        { id: 'MAV2-303', title: 'iOS UI fixes - navigation', assigneeId: 'tm1', storyPoints: 3, status: 'done', epic: 'iOS', sprint: 'Sprint 7', week: '2026-W07', projectId: 'proj3', description: 'Fix navigation bar glitches on iOS 17', acceptanceCriteria: 'No visual glitches on iPhone 14+', risksMitigation: '', blockers: '' },
        { id: 'MAV2-304', title: 'Android crash fix - startup', assigneeId: 'tm6', storyPoints: 5, status: 'done', epic: 'Android', sprint: 'Sprint 7', week: '2026-W07', projectId: 'proj3', description: 'Fix null pointer exception on cold start', acceptanceCriteria: '0 crash rate on startup in beta', risksMitigation: '', blockers: '' },
        { id: 'MAV2-305', title: 'Biometric auth integration', assigneeId: 'tm5', storyPoints: 5, status: 'blocked', epic: 'Auth', sprint: 'Sprint 7', week: '2026-W07', projectId: 'proj3', description: 'Face ID / Touch ID authentication', acceptanceCriteria: 'Auth works on Face ID and fingerprint devices', risksMitigation: 'Apple guidelines compliance risk - pre-review', blockers: 'Awaiting Apple developer support feedback on biometric guidelines' },
        { id: 'MAV2-306', title: 'App store screenshot assets', assigneeId: 'tm3', storyPoints: 2, status: 'inprogress', epic: 'Release', sprint: 'Sprint 7', week: '2026-W07', projectId: 'proj3', description: 'Create App Store and Play Store screenshots', acceptanceCriteria: 'All required device size screenshots created', risksMitigation: '', blockers: '' },
    ];
    const risks = [
        { id: 'r1', projectId: 'proj1', title: 'Third-party API rate limits', description: 'External payment API has rate limits that may affect peak load', probability: 'medium', impact: 'high', mitigation: 'Implement caching and request queuing. Negotiate higher tier with vendor.', ownerId: 'tm2', status: 'open' },
        { id: 'r2', projectId: 'proj1', title: 'Design resource bandwidth', description: 'Design team stretched thin across multiple projects', probability: 'high', impact: 'medium', mitigation: 'Contract design resource for 4 weeks to cover UA/UX debt.', ownerId: 'tpm1', status: 'mitigated' },
        { id: 'r3', projectId: 'proj2', title: 'Data governance approval delay', description: 'IT security review of analytics data access taking longer than expected', probability: 'high', impact: 'critical', mitigation: 'Escalate to CISO. Prepare data masking as interim solution.', ownerId: 'dir1', status: 'open' },
        { id: 'r4', projectId: 'proj2', title: 'ML model accuracy below threshold', description: 'Churn prediction model accuracy at 74%, target is 85%', probability: 'medium', impact: 'high', mitigation: 'Add more training data. Explore ensemble methods.', ownerId: 'tm6', status: 'open' },
        { id: 'r5', projectId: 'proj3', title: 'App Store review rejection risk', description: 'Biometric auth implementation may not meet App Store guidelines', probability: 'medium', impact: 'critical', mitigation: 'Pre-review with Apple developer support. Prepare fallback PIN flow.', ownerId: 'tm5', status: 'open' },
        { id: 'r6', projectId: 'proj3', title: 'Key developer departure risk', description: 'Lead mobile developer considering other opportunities', probability: 'low', impact: 'critical', mitigation: 'Accelerate knowledge transfer. Initiate retention package with HR.', ownerId: 'tpm1', status: 'open' },
    ];
    const leaveEntries = [
        { id: 'lv1', memberId: 'tm1', week: '2026-W08', hoursOff: 16, type: 'vacation' },
        { id: 'lv2', memberId: 'tm3', week: '2026-W07', hoursOff: 8, type: 'sick' },
        { id: 'lv3', memberId: 'tm4', week: '2026-W08', hoursOff: 8, type: 'holiday' },
        { id: 'lv4', memberId: 'tm5', week: '2026-W08', hoursOff: 40, type: 'vacation' },
        { id: 'lv5', memberId: 'tm2', week: '2026-W09', hoursOff: 16, type: 'vacation' },
        { id: 'lv6', memberId: 'tm6', week: '2026-W07', hoursOff: 8, type: 'wfh' },
    ];
    const weeklyReports = [
        { id: 'wr1', projectId: 'proj1', week: '2026-W08', ragStatus: 'green', accomplishments: '• Completed responsive dashboard layout fixes\n• Integrated user profile API\n• CI/CD pipeline optimized — build time reduced by 35%\n• 96% E2E test coverage for auth flow', nextWeekPlan: '• Complete notification system backend (CPR-103)\n• Unblock search feature — awaiting Elasticsearch cluster\n• Begin settings page - billing section', blockers: '• Elasticsearch cluster provisioning pending DevOps approval (blocking CPR-107)', risksMitigation: '', preparedBy: 'Kavita Singh', approvedBy: '', status: 'submitted', approvalComment: '', createdAt: '2026-02-23T10:00:00Z', updatedAt: '2026-02-23T10:00:00Z' },
        { id: 'wr2', projectId: 'proj2', week: '2026-W07', ragStatus: 'amber', accomplishments: '• Kafka stream connector deployed to staging\n• Chart library integrated with 5 dashboard components\n• CSV/Excel export feature shipped\n• DB query p95 latency improved from 800ms to 220ms', nextWeekPlan: '• Complete user permission roles for dashboards\n• Resolve alert threshold configuration blocker\n• Begin ML model result display component', blockers: '• IT Security data governance approval delayed — blocking production data access (P1)', risksMitigation: 'Data governance escalated to CISO', preparedBy: 'Kavita Singh', approvedBy: '', status: 'submitted', approvalComment: '', createdAt: '2026-02-20T10:00:00Z', updatedAt: '2026-02-20T10:00:00Z' },
        { id: 'wr3', projectId: 'proj3', week: '2026-W07', ragStatus: 'red', accomplishments: '• Push notification service shipped to iOS and Android\n• iOS navigation crash resolved\n• Android startup crash fix deployed to beta testers', nextWeekPlan: '• Resolve biometric auth blocker (Apple guidelines review)\n• Complete offline sync mechanism\n• Android beta submission to Play Store', blockers: '• Biometric auth implementation blocked pending Apple developer support feedback\n• Offline sync has complex conflict resolution — may need 2 additional sprints', risksMitigation: 'Pre-review with Apple developer support scheduled', preparedBy: 'Kavita Singh', approvedBy: '', status: 'submitted', approvalComment: '', createdAt: '2026-02-20T10:00:00Z', updatedAt: '2026-02-20T10:00:00Z' },
    ];

    function insertAll(table, rows, columns) {
        if (!rows.length) return;
        const placeholders = columns.map(() => '?').join(', ');
        const stmt = db.prepare(`INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
        rows.forEach(row => {
            const vals = columns.map(c => c === 'isMock' ? 1 : (row[c] !== undefined ? row[c] : null));
            stmt.run(vals);
        });
        stmt.finalize();
    }

    db.serialize(() => {
        insertAll('projects', projects, ['id', 'name', 'code', 'ownerId', 'projectType', 'status', 'ragStatus', 'startDate', 'endDate', 'budget', 'budgetSpent', 'description', 'isMock']);
        insertAll('team_members', teamMembers, ['id', 'name', 'role', 'appRole', 'avatar', 'email', 'totalHoursPerWeek', 'isMock']);
        insertAll('milestones', milestones, ['id', 'projectId', 'title', 'targetDate', 'actualDate', 'status', 'description', 'startDate', 'isMock']);
        insertAll('sprints', sprints, ['id', 'projectId', 'name', 'startDate', 'endDate', 'plannedPoints', 'completedPoints', 'week', 'isMock']);
        insertAll('jira_stories', jiraStories, ['id', 'title', 'assigneeId', 'storyPoints', 'status', 'epic', 'sprint', 'week', 'projectId', 'description', 'acceptanceCriteria', 'risksMitigation', 'blockers', 'isMock']);
        insertAll('risks', risks, ['id', 'projectId', 'title', 'description', 'probability', 'impact', 'mitigation', 'ownerId', 'status', 'isMock']);
        insertAll('leave_entries', leaveEntries, ['id', 'memberId', 'week', 'hoursOff', 'type', 'isMock']);
        insertAll('weekly_reports', weeklyReports, ['id', 'projectId', 'week', 'ragStatus', 'accomplishments', 'nextWeekPlan', 'blockers', 'risksMitigation', 'preparedBy', 'approvedBy', 'status', 'approvalComment', 'createdAt', 'updatedAt', 'isMock']);
        console.log('[DB] Mock data seed complete.');
        if (callback) callback(null);
    });
};
