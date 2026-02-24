const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/data', (req, res) => {
    const data = {};
    const tables = ['projects', 'team_members', 'jira_stories', 'milestones', 'sprints', 'risks', 'leave_entries', 'weekly_reports'];

    let completed = 0;
    tables.forEach(table => {
        db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            const camelName = table.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            data[camelName] = rows;
            completed++;

            if (completed === tables.length) {
                res.json(data);
            }
        });
    });
});

app.post('/api/stories', (req, res) => {
    const story = req.body;
    const columns = Object.keys(story);
    const placeholders = columns.map(() => '?').join(',');
    const sql = `INSERT OR REPLACE INTO jira_stories (${columns.join(',')}) VALUES (${placeholders})`;
    db.run(sql, Object.values(story), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/stories/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    const sets = keys.map(k => `${k} = ?`).join(',');
    db.run(`UPDATE jira_stories SET ${sets} WHERE id = ?`, [...Object.values(updates), id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/stories/bulk', (req, res) => {
    const stories = req.body;
    if (!Array.isArray(stories) || stories.length === 0) return res.json({ success: true });

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare(`INSERT OR REPLACE INTO jira_stories (${Object.keys(stories[0]).join(', ')}) VALUES (${Object.keys(stories[0]).map(() => '?').join(', ')})`);

        for (const story of stories) {
            stmt.run(Object.values(story));
        }
        stmt.finalize();
        db.run('COMMIT', (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.put('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    const sets = keys.map(k => `${k} = ?`).join(',');
    const sql = `UPDATE projects SET ${sets} WHERE id = ?`;
    db.run(sql, [...Object.values(updates), id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/team_members/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    const sets = keys.map(k => `${k} = ?`).join(',');
    const sql = `UPDATE team_members SET ${sets} WHERE id = ?`;
    db.run(sql, [...Object.values(updates), id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/team_members', (req, res) => {
    const member = req.body;
    const columns = Object.keys(member);
    const placeholders = columns.map(() => '?').join(',');
    const sql = `INSERT INTO team_members (${columns.join(',')}) VALUES (${placeholders})`;
    db.run(sql, Object.values(member), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/team_members/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM team_members WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/reports', (req, res) => {
    const report = req.body;
    const columns = Object.keys(report);
    const placeholders = columns.map(() => '?').join(',');
    const sql = `INSERT OR REPLACE INTO weekly_reports (${columns.join(',')}) VALUES (${placeholders})`;
    db.run(sql, Object.values(report), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/confluence/publish', async (req, res) => {
    const { reportRowHtml } = req.body;
    try {
        const configPath = path.join(__dirname, '..', 'confluence-config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8')).confluence;

        const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');
        const url = `${config.baseUrl}/rest/api/content/${config.targetPageId}?expand=body.storage,version`;

        // 1. Get current page content and version
        const getRes = await fetch(url, {
            headers: { 'Authorization': `Basic ${auth}` }
        });

        if (!getRes.ok) {
            const errText = await getRes.text();
            throw new Error(`Failed to fetch Confluence page: ${getRes.status} ${errText}`);
        }

        const page = await getRes.json();

        // 2. Parse content and append row
        let content = page.body.storage.value;

        // Confluence storage format usually has the table. 
        // We look for the last </tbody> to append the row.
        if (content.includes('</tbody>')) {
            const lastIndex = content.lastIndexOf('</tbody>');
            content = content.substring(0, lastIndex) + reportRowHtml + content.substring(lastIndex);
        } else if (content.includes('</table>')) {
            const lastIndex = content.lastIndexOf('</table>');
            content = content.substring(0, lastIndex) + `<tbody>${reportRowHtml}</tbody>` + content.substring(lastIndex);
        } else {
            // Fallback: create table if not found
            content += `<table><thead><tr><th>Week</th><th>Project</th><th>RAG</th><th>Accomplishments</th><th>Next Week Plan</th><th>Blockers</th><th>Prepared By</th><th>Approved By</th><th>Updated</th></tr></thead><tbody>${reportRowHtml}</tbody></table>`;
        }

        // 3. Update page
        const updateRes = await fetch(`${config.baseUrl}/rest/api/content/${config.targetPageId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: { number: page.version.number + 1 },
                title: page.title,
                type: 'page',
                body: {
                    storage: {
                        value: content,
                        representation: 'storage'
                    }
                }
            })
        });

        if (!updateRes.ok) {
            const errData = await updateRes.json();
            throw new Error(errData.message || 'Confluence API update failed');
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Confluence Publish Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
