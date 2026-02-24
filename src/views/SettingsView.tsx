import React, { useState, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import * as xlsx from 'xlsx';
import { Upload, Settings, RefreshCw, LayoutTemplate, Download, Users } from 'lucide-react';
import type { Project } from '../types/index';
import { transformBoardData } from '../utils/boardTransformer';

export default function SettingsView() {
    const { state, dispatch } = useDashboard();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const fileInput = useRef<HTMLInputElement>(null);

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

            if (!json.length) throw new Error("File is empty or invalid format.");

            const formattedStories = transformBoardData(json, state.selectedProjectId, state.selectedWeek);

            const res = await fetch(`${API_BASE}/stories/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedStories)
            });

            if (!res.ok) throw new Error('Failed to import stories');

            dispatch({ type: 'SET_DATA', payload: { jiraStories: [...state.jiraStories, ...formattedStories] } });
            setMsg({ type: 'success', text: `Successfully imported ${formattedStories.length} stories.` });
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

        if (type === 'scrum') {
            headers = ['Story ID', 'Title', 'Status', 'Story Points', 'Sprint', 'Assignee', 'Epic', 'Project ID', 'Week'];
            sampleRow = { 'Story ID': 'SCRUM-101', 'Title': 'Implement Login', 'Status': 'To Do', 'Story Points': 5, 'Sprint': 'Sprint 1', 'Assignee': 'tm1', 'Epic': 'Auth', 'Project ID': 'proj1', 'Week': '2026-W08' };
        } else if (type === 'kanban') {
            headers = ['Issue key', 'Summary', 'Status', 'Assignee', 'Epic', 'Project ID', 'Week'];
            sampleRow = { 'Issue key': 'KAN-202', 'Summary': 'Fix Header Bug', 'Status': 'In Progress', 'Assignee': 'tm2', 'Epic': 'UI', 'Project ID': 'proj1', 'Week': '2026-W08' };
        } else if (type === 'azure_boards') {
            headers = ['ID', 'Work Item Type', 'Title', 'State', 'Effort', 'Iteration Path', 'Area Path', 'Assigned To', 'Project ID', 'Week'];
            sampleRow = { 'ID': '9875', 'Work Item Type': 'User Story', 'Title': 'Azure AD Integration', 'State': 'Active', 'Effort': 8, 'Iteration Path': 'Sprint 1', 'Area Path': 'Backend', 'Assigned To': 'tm3', 'Project ID': 'proj2', 'Week': '2026-W08' };
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => fileInput.current?.click()}
                            disabled={loading}
                            style={{ justifyContent: 'center' }}
                        >
                            {loading ? 'Importing Data...' : 'Select Excel File'}
                        </button>

                        <div style={{ position: 'relative', display: 'flex', gap: 4 }}>
                            <button className="btn btn-secondary" onClick={() => downloadTemplate('scrum')} title="Download Scrum Template" style={{ flex: 1, padding: '8px 4px', justifyContent: 'center', fontSize: 11 }}>
                                <Download size={14} /> Scrum
                            </button>
                            <button className="btn btn-secondary" onClick={() => downloadTemplate('kanban')} title="Download Kanban Template" style={{ flex: 1, padding: '8px 4px', justifyContent: 'center', fontSize: 11 }}>
                                <Download size={14} /> Kanban
                            </button>
                            <button className="btn btn-secondary" onClick={() => downloadTemplate('azure_boards')} title="Download Azure Boards Template" style={{ flex: 1, padding: '8px 4px', justifyContent: 'center', fontSize: 11 }}>
                                <Download size={14} /> Azure
                            </button>
                        </div>
                    </div>
                </div>

                {/* Project Type Configuration */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <LayoutTemplate size={20} className="text-emerald" /> Project Typology
                    </h3>
                    <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
                        Configure the ongoing methodology applied to projects. This affects the charts generated in the TPM Command Center.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {state.projects.map(p => (
                            <div key={p.id} className="project-config-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 12, transition: 'var(--transition)' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{p.code} – {p.name}</div>
                                    <div style={{ fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="text-muted">Active Methodology:</span>
                                        <span style={{
                                            background: p.projectType === 'azure_boards' ? 'rgba(34, 211, 238, 0.15)' : 'var(--violet-dim)',
                                            color: p.projectType === 'azure_boards' ? 'var(--cyan)' : 'var(--violet-light)',
                                            padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11
                                        }}>
                                            {p.projectType?.toUpperCase().replace('_', ' ') || 'SCRUM'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => toggleProjectType(p)}
                                    style={{ padding: '8px 16px' }}
                                >
                                    Cycle Type <RefreshCw size={14} style={{ marginLeft: 6 }} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
