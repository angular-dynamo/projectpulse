import KPICards from '../components/KPICards';
import WeeklyStatusPanel from '../components/WeeklyStatusPanel';
import TaskProgressCharts from '../components/TaskProgressCharts';
import CapacityChart from '../components/CapacityChart';
import GanttChart from '../components/GanttChart';
import RiskPanel from '../components/RiskPanel';

interface Props {
    activeTab: string;
    setActiveTab: (t: string) => void;
}

export default function TPMDashboard({ activeTab }: Props) {
    return (
        <>
            {activeTab === 'kpi' && <KPICards />}
            {activeTab === 'weekly' && <WeeklyStatusPanel />}
            {activeTab === 'tasks' && <TaskProgressCharts />}
            {activeTab === 'capacity' && <CapacityChart />}
            {activeTab === 'milestones' && <GanttChart />}
            {activeTab === 'risks' && <RiskPanel />}
        </>
    );
}
