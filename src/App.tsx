import { useState, useEffect } from 'react';
import React from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { Persona } from './types/index';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import TPMDashboard from './views/TPMDashboard';
import DirectorDashboard from './views/DirectorDashboard';
import DeveloperDashboard from './views/DeveloperDashboard';
import LoginView from './views/LoginView';
import SettingsView from './views/SettingsView';
import UserRolesView from './views/UserRolesView';

function AppContent() {
    const { state, dispatch, serverDown, retryConnect } = useDashboard();
    const { user, isAuthenticated, isLoading } = useAuth();
    const [activeTab, setActiveTab] = React.useState('kpi');
    const [retryIn, setRetryIn] = React.useState(15);

    useEffect(() => {
        if (user && user.appRole !== state.persona) {
            // Map admin to tpm for now, or just let it pass if we add admin to Persona type
            const persona = user.appRole === 'admin' ? 'tpm' : user.appRole;
            dispatch({ type: 'SET_PERSONA', payload: persona as Persona });
            setActiveTab('kpi'); // Reset to default tab on persona change or login
        }
    }, [user, state.persona, dispatch]);

    // Server-down retry countdown
    useEffect(() => {
        if (!serverDown) { setRetryIn(15); return; }
        const t = setInterval(() => setRetryIn(p => p <= 1 ? 15 : p - 1), 1000);
        return () => clearInterval(t);
    }, [serverDown]);

    if (isLoading) return <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>Loading Workspace...</div>;
    if (!isAuthenticated || !user) {
        return (
            <div className={`theme-${state.theme}`}>
                <LoginView />
            </div>
        );
    }

    return (
        <div className={`app-layout theme-${state.theme}`}>
            {/* ERR-485 Server Down Banner */}
            {serverDown && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(8,12,26,0.92)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: 'rgba(15,22,45,0.98)',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: 20,
                        padding: '48px 56px',
                        maxWidth: 480,
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 0 60px rgba(239,68,68,0.2), 0 24px 64px rgba(0,0,0,0.6)',
                    }}>
                        <div style={{ fontSize: 56, marginBottom: 8 }}>⚠️</div>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: '#ef4444', textTransform: 'uppercase', marginBottom: 8 }}>ERR-485 — Backend Unreachable</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', marginBottom: 12 }}>Server is offline</div>
                        <div style={{ fontSize: 13, color: '#8892b0', marginBottom: 6, lineHeight: 1.6 }}>
                            Cannot connect to the API server at<br />
                            <code style={{ color: '#6d6cff', background: 'rgba(109,108,255,0.12)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>http://127.0.0.1:3001</code>
                        </div>
                        <div style={{ fontSize: 12, color: '#4a5578', marginBottom: 28 }}>Make sure the Node.js server is running: <code style={{ color: '#f59e0b' }}>node server/index.js</code></div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
                            <button
                                onClick={() => { retryConnect(); setRetryIn(15); }}
                                style={{ background: 'linear-gradient(135deg,#6d6cff,#9b6cff)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                            >
                                🔄 Retry Now
                            </button>
                            <span style={{ fontSize: 12, color: '#4a5578' }}>Auto-retry in {retryIn}s</span>
                        </div>
                    </div>
                </div>
            )}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} persona={state.persona} />
            <div className="main-content">
                <Topbar
                    persona={state.persona}
                    selectedWeek={state.selectedWeek}
                    setWeek={(w) => dispatch({ type: 'SET_WEEK', payload: w })}
                    selectedProjectId={state.selectedProjectId}
                    setProject={(id) => dispatch({ type: 'SET_PROJECT', payload: id })}
                    projects={state.projects}
                    weeks={Array.from(new Set(state.jiraStories.map(s => s.week).filter(Boolean))).sort()}
                    theme={state.theme}
                    dispatch={dispatch}
                    setActiveTab={setActiveTab}
                    activeTab={activeTab}
                />
                <div className="page-content">
                    {activeTab === 'settings' && (
                        <SettingsView />
                    )}
                    {activeTab === 'roles' && user.appRole === 'admin' && (
                        <UserRolesView />
                    )}
                    {activeTab !== 'settings' && activeTab !== 'roles' && state.persona === 'tpm' && (
                        <TPMDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
                    )}
                    {activeTab !== 'settings' && activeTab !== 'roles' && state.persona === 'director' && (
                        <DirectorDashboard />
                    )}
                    {activeTab !== 'settings' && activeTab !== 'roles' && state.persona === 'developer' && (
                        <DeveloperDashboard />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <DashboardProvider>
                <AppContent />
            </DashboardProvider>
        </AuthProvider>
    );
}
