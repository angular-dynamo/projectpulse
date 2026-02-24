import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, User, Star, Activity, Trash2, Search } from 'lucide-react';

export default function UserRolesView() {
    const { state, dispatch } = useDashboard();
    const { user: authUser } = useAuth();
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'developer' });
    const API_BASE = 'http://127.0.0.1:3001/api';

    // Restriction check
    if (!authUser || authUser.appRole !== 'admin') {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Shield size={48} style={{ color: 'var(--red)', marginBottom: 16 }} />
                <h2>Access Denied</h2>
                <p>Only administrators can manage user roles.</p>
            </div>
        );
    }

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
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err: any) {
            const updatedMembers = state.teamMembers.map(m => m.id === id ? { ...m, appRole: newRole as any } : m);
            dispatch({ type: 'SET_DATA', payload: { teamMembers: updatedMembers } });
            setMsg({ type: 'success', text: `Role updated (Locally).` });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsAdding(true);
            const newId = `tm_${Date.now()}`;
            const memberObj = {
                id: newId,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role === 'admin' ? 'Administrator' :
                    newUser.role === 'tpm' ? 'Technical Program Manager' :
                        newUser.role === 'director' ? 'Director' : 'Developer',
                appRole: newUser.role,
                avatar: newUser.name.charAt(0).toUpperCase(),
                totalHoursPerWeek: 40
            };

            const res = await fetch(`${API_BASE}/team_members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberObj)
            });

            if (!res.ok) throw new Error("Backend update failed");

            dispatch({ type: 'SET_DATA', payload: { teamMembers: [...state.teamMembers, memberObj] } });
            setMsg({ type: 'success', text: `User ${newUser.name} added successfully.` });
            setNewUser({ name: '', email: '', role: 'developer' });
        } catch (err: any) {
            setMsg({ type: 'error', text: `Failed to add user.` });
        } finally {
            setIsAdding(false);
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            const res = await fetch(`${API_BASE}/team_members/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error("Backend deletion failed");

            const updatedMembers = state.teamMembers.filter(m => m.id !== id);
            dispatch({ type: 'SET_DATA', payload: { teamMembers: updatedMembers } });
            setMsg({ type: 'success', text: `User deleted successfully.` });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err: any) {
            // Local fallback
            const updatedMembers = state.teamMembers.filter(m => m.id !== id);
            dispatch({ type: 'SET_DATA', payload: { teamMembers: updatedMembers } });
            setMsg({ type: 'success', text: `User deleted (Locally).` });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        }
    };

    const filteredUsers = state.teamMembers.filter(m => {
        const matchesName = m.name.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesEmail = m.email.toLowerCase().includes(emailFilter.toLowerCase());
        const matchesRole = roleFilter === 'all' || (m.appRole || 'developer') === roleFilter;
        return matchesName && matchesEmail && matchesRole;
    });

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield size={14} className="text-red" />;
            case 'director': return <Star size={14} className="text-amber" />;
            case 'tpm': return <Activity size={14} className="text-violet" />;
            default: return <User size={14} className="text-cyan" />;
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users /> User Role Management
            </h2>

            {msg.text && (
                <div style={{
                    padding: 16, marginBottom: 24, borderLeft: '4px solid', borderRadius: '0 8px 8px 0',
                    background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    borderColor: msg.type === 'error' ? 'var(--red)' : 'var(--emerald)',
                    color: msg.type === 'error' ? 'var(--red)' : 'var(--emerald)',
                    display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500
                }}>
                    {msg.text}
                </div>
            )}

            <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Add New User</h3>
                <form onSubmit={handleAddUser} style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Full Name</label>
                        <input type="text" className="form-input" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="John Doe" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-input" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@example.com" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Dashboard Role</label>
                        <select className="form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                            <option value="tpm">TPM</option>
                            <option value="director">Director</option>
                            <option value="developer">Developer</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isAdding} style={{ height: 38 }}>
                        {isAdding ? 'Adding...' : 'Add User'}
                    </button>
                </form>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 18, margin: 0 }}>System Users</h3>
                    <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                        Assign role-based access for your team. This will immediately update their dashboard view and permissions.
                    </p>
                </div>

                <table className="data-table" style={{ margin: 0, width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: 24 }}>User</th>
                            <th>Email Address</th>
                            <th>Current Role</th>
                            <th style={{ width: 200 }}>Assign New Role</th>
                            <th style={{ width: 80, paddingRight: 24 }}>Actions</th>
                        </tr>
                        <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border)' }}>
                            <td style={{ paddingLeft: 24, paddingBottom: 12 }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search name..."
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                    style={{ fontSize: 12, padding: '6px 10px', height: 30 }}
                                />
                            </td>
                            <td style={{ paddingBottom: 12 }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search email..."
                                    value={emailFilter}
                                    onChange={(e) => setEmailFilter(e.target.value)}
                                    style={{ fontSize: 12, padding: '6px 10px', height: 30 }}
                                />
                            </td>
                            <td style={{ paddingBottom: 12 }}>
                                <select
                                    className="form-select"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    style={{ fontSize: 12, padding: '4px 8px', height: 30 }}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="tpm">TPM</option>
                                    <option value="director">Director</option>
                                    <option value="developer">Developer</option>
                                </select>
                            </td>
                            <td colSpan={2}></td>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No users found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(member => (
                                <tr key={member.id}>
                                    <td style={{ paddingLeft: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--violet), var(--cyan))', color: '#fff', width: 36, height: 36, fontSize: 13 }}>
                                                {member.avatar || member.name.charAt(0)}
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.name}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-muted" style={{ fontSize: 13 }}>{member.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-glass)', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                                            {getRoleIcon(member.appRole || 'developer')}
                                            {member.appRole || 'developer'}
                                        </div>
                                    </td>
                                    <td style={{ paddingRight: 24 }}>
                                        <select
                                            className="form-select" style={{ fontSize: 13, padding: '8px 12px' }}
                                            value={member.appRole || 'developer'}
                                            onChange={(e) => updateRole(member.id, e.target.value)}
                                        >
                                            <option value="tpm">TPM</option>
                                            <option value="director">Director</option>
                                            <option value="developer">Developer</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </td>
                                    <td style={{ paddingRight: 24 }}>
                                        <button
                                            onClick={() => handleDeleteUser(member.id)}
                                            className="btn-icon"
                                            style={{ color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
