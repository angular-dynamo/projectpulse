import { useState, useEffect } from 'react';
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
    const { state, dispatch } = useDashboard();
    const { user, isAuthenticated, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('kpi');

    useEffect(() => {
        if (user && user.appRole !== state.persona) {
            // Map admin to tpm for now, or just let it pass if we add admin to Persona type
            const persona = user.appRole === 'admin' ? 'tpm' : user.appRole;
            dispatch({ type: 'SET_PERSONA', payload: persona as Persona });
            setActiveTab('kpi'); // Reset to default tab on persona change or login
        }
    }, [user, state.persona, dispatch]);

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
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} persona={state.persona} />
            <div className="main-content">
                <Topbar
                    persona={state.persona}
                    selectedWeek={state.selectedWeek}
                    setWeek={(w) => dispatch({ type: 'SET_WEEK', payload: w })}
                    selectedProjectId={state.selectedProjectId}
                    setProject={(id) => dispatch({ type: 'SET_PROJECT', payload: id })}
                    projects={state.projects}
                    theme={state.theme}
                    dispatch={dispatch}
                    setActiveTab={setActiveTab}
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
