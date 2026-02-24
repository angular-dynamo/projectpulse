import { useState } from 'react';
import type { WeeklyReport } from '../types/index';
import { Copy, Download, Send, CheckCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

interface Props {
    report: WeeklyReport;
}

function escHtml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}

function buildConfluenceRow(report: WeeklyReport, projectName: string, projectCode: string) {
    const ragColor = report.ragStatus === 'green' ? '#00875a' : report.ragStatus === 'amber' ? '#ff991f' : '#de350b';
    const ragIcon = report.ragStatus === 'green' ? '🟢' : report.ragStatus === 'amber' ? '🟡' : '🔴';
    const today = new Date().toISOString().slice(0, 10);

    return `<tr>
  <td><strong>${report.week}</strong></td>
  <td>[${projectCode}] ${projectName}</td>
  <td><span style="color:${ragColor};font-weight:bold;">${ragIcon} ${report.ragStatus.toUpperCase()}</span></td>
  <td>${escHtml(report.accomplishments)}</td>
  <td>${escHtml(report.nextWeekPlan)}</td>
  <td>${escHtml(report.blockers) || '<em>None</em>'}</td>
  <td>${report.preparedBy}</td>
  <td>${report.approvedBy ?? '—'}</td>
  <td>${today}</td>
</tr>`;
}

export default function ConfluenceExporter({ report }: Props) {
    const { state } = useDashboard();
    const [copied, setCopied] = useState(false);
    const [published, setPublished] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publishError, setPublishError] = useState('');

    const project = state.projects.find(p => p.id === report.projectId);
    const html = buildConfluenceRow(report, project?.name ?? '', project?.code ?? '');

    const tableHtml = `<!-- Confluence Weekly Status Table Row -->
<!-- Paste into your Confluence page table -->
<table>
  <thead>
    <tr>
      <th>Week</th><th>Project</th><th>RAG</th>
      <th>Accomplishments</th><th>Next Week Plan</th>
      <th>Blockers</th><th>Prepared By</th><th>Approved By</th><th>Updated</th>
    </tr>
  </thead>
  <tbody>
${html}
  </tbody>
</table>`;

    function handleCopy() {
        navigator.clipboard.writeText(tableHtml).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }

    function handleDownload() {
        const blob = new Blob([tableHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `confluence_${report.week}_${project?.code}.html`;
        a.click(); URL.revokeObjectURL(url);
    }

    async function handlePublish() {
        setPublishing(true);
        setPublishError('');
        try {
            const res = await fetch('http://127.0.0.1:3001/api/confluence/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportRowHtml: html, week: report.week, projectId: project?.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Publish failed');
            setPublished(true);
            setTimeout(() => setPublished(false), 4000);
        } catch (err: any) {
            setPublishError(err.message || 'Failed to publish to Confluence');
        } finally {
            setPublishing(false);
        }
    }

    return (
        <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
            <div className="card-header">
                <div className="card-title">
                    <span style={{ background: 'var(--emerald-dim)', color: 'var(--emerald)', borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>✓ APPROVED</span>
                    Confluence Export — {project?.code} {report.week}
                </div>
                <div className="text-xs text-muted">Approved by {report.approvedBy}</div>
            </div>

            {/* Preview */}
            <div className="confluence-preview" dangerouslySetInnerHTML={{ __html: tableHtml }}></div>

            {/* Actions */}
            <div className="flex gap-8 mt-12">
                <button className={`btn btn-secondary btn-sm ${copied ? 'btn-success' : ''}`} onClick={handleCopy}>
                    {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy HTML'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
                    <Download size={13} /> Download .html
                </button>
                <button className="btn btn-primary btn-sm" onClick={handlePublish} disabled={published || publishing}>
                    {published ? <><CheckCircle size={13} /> Published!</> : publishing ? 'Publishing...' : <><Send size={13} /> Publish to Confluence</>}
                </button>
            </div>

            {published && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--emerald-dim)', borderRadius: 8, fontSize: 12, color: 'var(--emerald)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CheckCircle size={14} /> Successfully published to Confluence page — Row added for {report.week}.
                </div>
            )}
            {publishError && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--red)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    ⚠ Publish failed: {publishError}
                </div>
            )}

            {/* Metadata */}
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 20 }}>
                <span>📋 Week: <strong style={{ color: 'var(--text-secondary)' }}>{report.week}</strong></span>
                <span>🚦 RAG: <strong style={{ color: report.ragStatus === 'green' ? 'var(--emerald)' : report.ragStatus === 'amber' ? 'var(--amber)' : 'var(--red)' }}>{report.ragStatus.toUpperCase()}</strong></span>
                <span>👤 By: <strong style={{ color: 'var(--text-secondary)' }}>{report.preparedBy}</strong></span>
                <span>✅ Approved: <strong style={{ color: 'var(--emerald)' }}>{report.approvedBy}</strong></span>
            </div>
        </div>
    );
}
