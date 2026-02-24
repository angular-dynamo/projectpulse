import { useState } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { Persona } from './types';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import TPMDashboard from './views/TPMDashboard';
import DirectorDashboard from './views/DirectorDashboard';
import DeveloperDashboard from './views/DeveloperDashboard';

function AppContent() {
    const { state, dispatch } = useDashboard();
    const [activeTab, setActiveTab] = useState('kpi');

    const personaLabels: Record<Persona, string> = {
        tpm: 'TPM',
        director: 'Director',
        developer: 'Developer',
    };

    return (
        <div className="app-layout">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} persona={state.persona} />
            <div className="main-content">
                <Topbar
                    persona={state.persona}
                    setPersona={(p) => { dispatch({ type: 'SET_PERSONA', payload: p }); setActiveTab('kpi'); }}
                    personaLabels={personaLabels}
                    selectedWeek={state.selectedWeek}
                    setWeek={(w) => dispatch({ type: 'SET_WEEK', payload: w })}
                    selectedProjectId={state.selectedProjectId}
                    setProject={(id) => dispatch({ type: 'SET_PROJECT', payload: id })}
                    projects={state.projects}
                />
                <div className="page-content">
                    {state.persona === 'tpm' && (
                        <TPMDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
                    )}
                    {state.persona === 'director' && (
                        <DirectorDashboard />
                    )}
                    {state.persona === 'developer' && (
                        <DeveloperDashboard />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <DashboardProvider>
            <AppContent />
        </DashboardProvider>
    );
}
