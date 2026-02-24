import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { DashboardState, Persona, JiraStory, WeeklyReport } from '../types';
import {
    teamMembers, projects, jiraStories, milestones,
    sprints, risks, leaveEntries, weeklyReports, CURRENT_WEEK
} from '../data/mockData';

type Action =
    | { type: 'SET_PERSONA'; payload: Persona }
    | { type: 'SET_WEEK'; payload: string }
    | { type: 'SET_PROJECT'; payload: string }
    | { type: 'ADD_STORY'; payload: JiraStory }
    | { type: 'UPDATE_STORY'; payload: JiraStory }
    | { type: 'UPDATE_REPORT'; payload: WeeklyReport }
    | { type: 'ADD_REPORT'; payload: WeeklyReport };

const initialState: DashboardState = {
    persona: 'tpm',
    selectedWeek: CURRENT_WEEK,
    selectedProjectId: 'proj1',
    projects,
    teamMembers,
    jiraStories,
    milestones,
    sprints,
    risks,
    leaveEntries,
    weeklyReports,
};

function reducer(state: DashboardState, action: Action): DashboardState {
    switch (action.type) {
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
        default: return state;
    }
}

interface DashboardContextType {
    state: DashboardState;
    dispatch: React.Dispatch<Action>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    return (
        <DashboardContext.Provider value={{ state, dispatch }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
    return ctx;
}
