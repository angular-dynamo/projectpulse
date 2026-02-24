import React from 'react';
import { useContext, useEffect } from 'react';
import { JiraContext } from '../context/JiraContext';

const JiraImportPage: React.FC = () => {
    const { fetchIssues, issues } = useContext(JiraContext);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    return (
        <div className="jira-import-page">
            <h1>JIRA Issues</h1>
            <ul>
                {issues.map(issue => (
                    <li key={issue.id}>{issue.title}</li>
                ))}
            </ul>
        </div>
    );
};

export default JiraImportPage;