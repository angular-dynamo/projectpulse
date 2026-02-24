import React, { useState, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import * as xlsx from 'xlsx';
import { Upload, Settings, RefreshCw, LayoutTemplate, Download, Users, Search } from 'lucide-react';
import type { Project } from '../types/index';
import { transformBoardData } from '../utils/boardTransformer';

export default function SettingsView() {
    const { state, dispatch } = useDashboard();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const fileInput = useRef<HTMLInputElement>(null);
    const [projSearch, setProjSearch] = useState('');
    const [projTypeFilter, setProjTypeFilter] = useState('all');

    const API_BASE = 'http://127.0.0.1:3001/api';

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const data = await file.arrayBuffer();
            const workbook = xlsx.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = xlsx.utils.sheet_to_json(worksheet);

            if (!json.length) throw new Error('File is empty or invalid format.');

            const { stories: formattedStories, projects, projectId, projectName } = transformBoardData(json, state.selectedProjectId, state.selectedWeek);

            // 1. Upsert ALL unique projects found in the data
            for (const proj of projects) {
                if (!proj.name || !proj.name.trim()) {
                    throw new Error(`Project "${proj.id}" is missing a Name. Please fill in the "Project Name" column.`);
                }
                await fetch(`${API_BASE}/projects/upsert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: proj.id,
                        name: proj.name,
                        code: proj.code,
                        projectType: proj.type,
                        status: 'on-track',
                        ragStatus: 'green',
                    })
                });
            }

            // 2. Bulk-save stories (all rows)
            const res = await fetch(`${API_BASE}/stories/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedStories)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (res.status === 409 && errData.duplicates?.length) {
                    const dupList = errData.duplicates.slice(0, 5).join(', ');
                    const more = errData.duplicates.length > 5 ? ` (+${errData.duplicates.length - 5} more)` : '';
                    throw new Error(`⚠️ Duplicate records found: ${dupList}${more}. Delete existing data first or use different Story IDs.`);
                }
                throw new Error(errData.error || 'Failed to import stories');
            }

            // 3. Re-fetch ALL data from DB
            const freshData = await fetch(`${API_BASE}/data`).then(r => r.json());
            const weeks = [...new Set(freshData.jiraStories?.map((s: any) => s.week) ?? [])].filter(Boolean).sort() as string[];
            const latestWeek = weeks[weeks.length - 1] ?? state.selectedWeek;

            console.log(`[Import] Read ${json.length} rows. Imported ${formattedStories.length} stories across ${projects.length} projects.`);

            dispatch({
                type: 'SET_DATA',
                payload: {
                    ...freshData,
                    selectedProjectId: projectId || state.selectedProjectId,
                    selectedWeek: latestWeek,
                }
            });

            setMsg({ type: 'success', text: `✅ ${formattedStories.length} stories imported across ${projects.length} projects. (Latest week: ${latestWeek})` });
        } catch (error: any) {
            setMsg({ type: 'error', text: error.message || 'Import failed' });
        } finally {
            setLoading(false);
            if (fileInput.current) fileInput.current.value = '';
        }
    };

    const toggleProjectType = async (project: Project) => {
        const types: Project['projectType'][] = ['scrum', 'kanban', 'azure_boards'];
        const currentIndex = types.indexOf(project.projectType || 'scrum');
        const newType = types[(currentIndex + 1) % types.length];

        try {
            const res = await fetch(`${API_BASE}/projects/${project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectType: newType })
            });

            if (!res.ok) throw new Error("Backend update failed");

            const updatedProjects = state.projects.map(p => p.id === project.id ? { ...p, projectType: newType as any } : p);
            dispatch({ type: 'SET_DATA', payload: { projects: updatedProjects } });
            setMsg({ type: 'success', text: `Project ${project.code} updated to ${newType.toUpperCase()}.` });
        } catch (err: any) {
            // Fallback to local state if backend route missing/fails
            const updatedProjects = state.projects.map(p => p.id === project.id ? { ...p, projectType: newType as any } : p);
            dispatch({ type: 'SET_DATA', payload: { projects: updatedProjects } });
            setMsg({ type: 'success', text: `Project ${project.code} updated to ${newType.toUpperCase()} (Locally).` });
        }
    };

    const downloadTemplate = (type: 'scrum' | 'kanban' | 'azure_boards') => {
        const wb = xlsx.utils.book_new();
        let headers: string[] = [];
        let sampleRow: any = {};

        const commonProjectFields = { 'Project Name': 'My Project', 'Project ID': 'proj1', 'Project Code': 'MP' };

        if (type === 'scrum') {
            headers = ['Project Name', 'Project ID', 'Project Code', 'Story ID', 'Title', 'Status', 'Story Points', 'Sprint', 'Assignee', 'Epic', 'Week', 'Description', 'Acceptance Criteria', 'Comments', 'Date', 'Risks & Mitigation', 'Blockers'];
            sampleRow = { ...commonProjectFields, 'Story ID': 'SCRUM-101', 'Title': 'Implement Login', 'Status': 'To Do', 'Story Points': 5, 'Sprint': 'Sprint 1', 'Assignee': 'John Doe', 'Epic': 'Auth', 'Week': '2026-W08', 'Description': 'Setup auth', 'Acceptance Criteria': 'Users can log in', 'Comments': 'No blockers', 'Date': '2026-02-25', 'Risks & Mitigation': 'API delay - mock it', 'Blockers': 'None' };
        } else if (type === 'kanban') {
            headers = ['Project Name', 'Project ID', 'Project Code', 'Issue key', 'Summary', 'Status', 'Assignee', 'Epic', 'Week', 'Description', 'Acceptance Criteria', 'Comments', 'Date', 'Risks & Mitigation', 'Blockers'];
            sampleRow = { ...commonProjectFields, 'Issue key': 'KAN-202', 'Summary': 'Fix Header Bug', 'Status': 'In Progress', 'Assignee': 'Jane Smith', 'Epic': 'UI', 'Week': '2026-W08', 'Description': 'Header is misaligned', 'Acceptance Criteria': 'Header is straight', 'Comments': 'WIP', 'Date': '2026-02-25', 'Risks & Mitigation': 'CSS conflicts - refactor', 'Blockers': 'Design missing' };
        } else if (type === 'azure_boards') {
            headers = ['Project Name', 'Project ID', 'Project Code', 'ID', 'Work Item Type', 'Title', 'State', 'Effort', 'Iteration Path', 'Area Path', 'Assigned To', 'Week', 'Description', 'Acceptance Criteria', 'Comments', 'Date', 'Risks & Mitigation', 'Blockers'];
            sampleRow = { ...commonProjectFields, 'ID': '9875', 'Work Item Type': 'User Story', 'Title': 'Azure AD Integration', 'State': 'Active', 'Effort': 8, 'Iteration Path': 'Sprint 1', 'Area Path': 'Backend', 'Assigned To': 'Alex Lee', 'Week': '2026-W08', 'Description': 'AD Sync', 'Acceptance Criteria': 'Syncs hourly', 'Comments': 'Blocked by ops', 'Date': '2026-02-25', 'Risks & Mitigation': 'Security review - schedule early', 'Blockers': 'Ops team availability' };
        }

        const ws = xlsx.utils.json_to_sheet([sampleRow], { header: headers });
        xlsx.utils.book_append_sheet(wb, ws, 'Template');
        xlsx.writeFile(wb, `${type}_template.xlsx`);
    };

    const updateRole = async (id: string, newRole: string) => {
        try {
            const res = await fetch(`${API_BASE}/team_members/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appRole: newRole })
            });

            if (!res.ok) throw new Error("Backend update failed");

            const updatedMembers = state.teamMembers.map(m => m.id === id ? { ...m, appRole: newRole as any } : m);
            dispatch({ type: 'SET_DATA', payload: { teamMembers: updatedMembers } });
            setMsg({ type: 'success', text: `Role updated successfully.` });
        } catch (err: any) {
            const updatedMembers = state.teamMembers.map(m => m.id === id ? { ...m, appRole: newRole as any } : m);
            dispatch({ type: 'SET_DATA', payload: { teamMembers: updatedMembers } });
            setMsg({ type: 'success', text: `Role updated (Locally).` });
        }
    };

    return (
        <div className="settings-container" style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
            <div className="settings-header" style={{ marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                    <Settings className="text-violet" /> Global Settings & Configuration
                </h2>
                <p className="text-muted" style={{ marginTop: 8, fontSize: 14 }}>Manage import templates, methodology structures, and integrations across the entire dashboard.</p>
            </div>

            {msg.text && (
                <div style={{
                    padding: 16, marginBottom: 24, borderRadius: 8,
                    background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    color: msg.type === 'error' ? 'var(--red)' : 'var(--emerald)',
                    display: 'flex', alignItems: 'center', gap: 10
                }}>
                    <RefreshCw size={18} className={loading && msg.type !== 'error' && msg.type !== 'success' ? 'spin' : ''} /> {msg.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                {/* Dummy Data Import */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Upload size={20} className="text-violet" /> Import Dummy Data
                    </h3>
                    <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
                        Upload an Excel (.xlsx) file containing Jira stories to populate the database for demonstration purposes.
                        The file must contain headers like Title, Status, Story Points, Sprint, Project ID, Week.
                    </p>

                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        ref={fileInput}
                        style={{ display: 'none' }}
                        onChange={handleImport}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => fileInput.current?.click()}
                            disabled={loading}
                            style={{ justifyContent: 'center', width: '100%' }}
                        >
                            {loading ? 'Importing Data...' : '⬆ Select Excel File to Import'}
                        </button>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            <button className="btn btn-secondary" onClick={() => downloadTemplate('scrum')} title="Download Scrum Template" style={{ justifyContent: 'center', fontSize: 11, padding: '7px 8px' }}>
                                <Download size={13} /> Scrum
                            </button>
                            <button className="btn btn-secondary" onClick={() => downloadTemplate('kanban')} title="Download Kanban Template" style={{ justifyContent: 'center', fontSize: 11, padding: '7px 8px' }}>
                                <Download size={13} /> Kanban
                            </button>
                            <button className="btn btn-secondary" onClick={() => downloadTemplate('azure_boards')} title="Download Azure Boards Template" style={{ justifyContent: 'center', fontSize: 11, padding: '7px 8px' }}>
                                <Download size={13} /> Azure
                            </button>
                        </div>
                        <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>Download a template first, fill in your data, then upload.</p>
                    </div>
                </div>

                {/* Project Topology Table */}
                <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                        <h3 style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LayoutTemplate size={20} className="text-emerald" /> Project Topology
                        </h3>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <select
                                className="form-input"
                                style={{ padding: '6px 12px', fontSize: 12, width: 'auto' }}
                                value={projTypeFilter}
                                onChange={e => setProjTypeFilter(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="scrum">Scrum</option>
                                <option value="kanban">Kanban</option>
                                <option value="azure_boards">Azure Boards</option>
                            </select>
                            <span className="text-muted text-sm">
                                {state.projects.length} project{state.projects.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                {/* Search row */}
                                <tr className="filter-row" style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border)' }}>
                                    <th colSpan={5} style={{ padding: '8px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                            <input
                                                type="text"
                                                className="form-input"
                                                style={{ width: '100%', padding: '4px 8px', fontSize: 12, height: 28 }}
                                                placeholder="Search by project name, code or ID..."
                                                value={projSearch}
                                                onChange={e => setProjSearch(e.target.value)}
                                            />
                                        </div>
                                    </th>
                                </tr>
                                {/* Header row */}
                                <tr>
                                    <th>Project Name</th>
                                    <th>Code</th>
                                    <th>Project ID</th>
                                    <th>Topology / Type</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const q = projSearch.toLowerCase();
                                    const filtered = state.projects.filter(p => {
                                        const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                                        const matchType = projTypeFilter === 'all' || p.projectType === projTypeFilter;
                                        return matchSearch && matchType;
                                    });

                                    if (state.projects.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    No projects yet — upload an Excel file or enable mock data on login.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    if (filtered.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                                    No projects match your filter.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return filtered.map(p => {
                                        const typeColor = p.projectType === 'azure_boards' ? 'var(--cyan)' : p.projectType === 'kanban' ? 'var(--amber)' : 'var(--violet-light)';
                                        const typeBg = p.projectType === 'azure_boards' ? 'rgba(34,211,238,0.12)' : p.projectType === 'kanban' ? 'rgba(245,158,11,0.12)' : 'var(--violet-dim)';
                                        return (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</td>
                                                <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--violet-light)' }}>{p.code}</span></td>
                                                <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{p.id}</span></td>
                                                <td>
                                                    <span style={{ background: typeBg, color: typeColor, padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                                                        {(p.projectType || 'scrum').toUpperCase().replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn btn-secondary" onClick={() => toggleProjectType(p)} style={{ padding: '5px 12px', fontSize: 12 }}>
                                                        <RefreshCw size={12} /> Cycle Type
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
