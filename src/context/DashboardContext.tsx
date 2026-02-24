import React, { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from 'react';
import type { DashboardState, Persona, JiraStory, WeeklyReport } from '../types/index';

const API_BASE = 'http://127.0.0.1:3001/api';

type Action =
    | { type: 'SET_DATA'; payload: Partial<DashboardState> }
    | { type: 'SET_PERSONA'; payload: Persona }
    | { type: 'SET_WEEK'; payload: string }
    | { type: 'SET_PROJECT'; payload: string }
    | { type: 'ADD_STORY'; payload: JiraStory }
    | { type: 'UPDATE_STORY'; payload: JiraStory }
    | { type: 'UPDATE_REPORT'; payload: WeeklyReport }
    | { type: 'ADD_REPORT'; payload: WeeklyReport }
    | { type: 'TOGGLE_THEME' };

const initialState: DashboardState = {
    persona: 'tpm',
    selectedWeek: '',
    selectedProjectId: 'proj1',
    projects: [],
    teamMembers: [],
    jiraStories: [],
    milestones: [],
    sprints: [],
    risks: [],
    leaveEntries: [],
    weeklyReports: [],
    theme: 'light',
};

function reducer(state: DashboardState, action: Action): DashboardState {
    switch (action.type) {
        case 'SET_DATA': return { ...state, ...action.payload };
        case 'SET_PERSONA': return { ...state, persona: action.payload };
        case 'SET_WEEK': return { ...state, selectedWeek: action.payload };
        case 'SET_PROJECT': return { ...state, selectedProjectId: action.payload };
        case 'ADD_STORY': return { ...state, jiraStories: [...state.jiraStories, action.payload] };
        case 'UPDATE_STORY': return {
            ...state,
            jiraStories: state.jiraStories.map(s => s.id === action.payload.id ? action.payload : s)
        };
        case 'ADD_REPORT': return { ...state, weeklyReports: [...state.weeklyReports, action.payload] };
        case 'UPDATE_REPORT': return {
            ...state,
            weeklyReports: state.weeklyReports.map(r => r.id === action.payload.id ? action.payload : r)
        };
        case 'TOGGLE_THEME': return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
        default: return state;
    }
}

interface DashboardContextType {
    state: DashboardState;
    dispatch: React.Dispatch<Action>;
    serverDown: boolean;
    retryConnect: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [serverDown, setServerDown] = useState(false);

    const loadData = () => {
        fetch(`${API_BASE}/data`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                setServerDown(false);
                const firstProjectId = data.projects?.[0]?.id ?? '';
                const weeks = [...new Set((data.jiraStories ?? []).map((s: any) => s.week))].filter(Boolean).sort() as string[];
                const latestWeek = weeks[weeks.length - 1] ?? '';
                dispatch({
                    type: 'SET_DATA',
                    payload: {
                        ...data,
                        selectedProjectId: firstProjectId || initialState.selectedProjectId,
                        selectedWeek: latestWeek,
                    }
                });
            })
            .catch(err => {
                console.error('[ERR-485] Backend unreachable:', err.message);
                setServerDown(true);
                dispatch({
                    type: 'SET_DATA',
                    payload: { projects: [], teamMembers: [], jiraStories: [], milestones: [], sprints: [], risks: [], leaveEntries: [], weeklyReports: [] }
                });
            });
    };

    // Initial data load
    useEffect(() => { loadData(); }, []);

    // Auto-retry every 15s while server is down — banner dismisses automatically on recovery
    useEffect(() => {
        if (!serverDown) return;
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, [serverDown]);

    return (
        <DashboardContext.Provider value={{ state, dispatch, serverDown, retryConnect: loadData }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
    return ctx;
}
