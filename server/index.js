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

// POST /api/seed — seed mock data only if DB is currently empty
app.post('/api/seed', (req, res) => {
    db.get('SELECT COUNT(*) as cnt FROM projects', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row.cnt > 0) {
            return res.json({ seeded: false, message: 'Database already has data — skipping seed.' });
        }

        const seedData = require('./seed');
        seedData(db, (seedErr) => {
            if (seedErr) return res.status(500).json({ error: seedErr.message });
            res.json({ seeded: true, message: 'Mock data seeded successfully.' });
        });
    });
});

// POST /api/projects/upsert — create or update a project from Excel upload
app.post('/api/projects/upsert', (req, res) => {
    const { id, name, code, projectType, ownerId, startDate, endDate, budget, budgetSpent, description, status, ragStatus } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name are required' });

    const sql = `INSERT INTO projects (id, name, code, projectType, ownerId, startDate, endDate, budget, budgetSpent, description, status, ragStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, code=excluded.code, projectType=excluded.projectType,
            ownerId=excluded.ownerId, startDate=excluded.startDate, endDate=excluded.endDate,
            budget=excluded.budget, budgetSpent=excluded.budgetSpent, description=excluded.description,
            status=excluded.status, ragStatus=excluded.ragStatus`;
    db.run(sql, [
        id, name, code || id.slice(0, 8).toUpperCase(),
        projectType || 'scrum', ownerId || 'admin0',
        startDate || new Date().toISOString().slice(0, 10),
        endDate || '', budget || 0, budgetSpent || 0,
        description || '', status || 'on-track', ragStatus || 'green'
    ], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/stories', (req, res) => {
    const story = req.body;
    const columns = Object.keys(story);
    const placeholders = columns.map(() => '?').join(',');
    const updateCols = columns.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(', ');
    const sql = `INSERT INTO jira_stories (${columns.join(',')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updateCols}`;
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

    const incomingIds = stories.map(s => s.id);
    const placeholders = incomingIds.map(() => '?').join(', ');

    // Step 1: Check for duplicates — only match against REAL data (isMock=0)
    db.all(
        `SELECT id FROM jira_stories WHERE id IN (${placeholders}) AND (isMock = 0 OR isMock IS NULL)`,
        incomingIds,
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            if (rows.length > 0) {
                const duplicateIds = rows.map(r => r.id);
                return res.status(409).json({
                    error: `Duplicate story IDs found. Upload rejected to protect existing data.`,
                    duplicates: duplicateIds
                });
            }

            // Step 2: Insert all stories tagged as real data (isMock=0)
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                try {
                    const baseColumns = Object.keys(stories[0]);
                    // Ensure isMock is included
                    const columns = baseColumns.includes('isMock') ? baseColumns : [...baseColumns, 'isMock'];
                    const phStr = columns.map(() => '?').join(', ');
                    const updateCols = columns.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(', ');
                    const stmt = db.prepare(`INSERT INTO jira_stories (${columns.join(', ')}) VALUES (${phStr}) ON CONFLICT(id) DO UPDATE SET ${updateCols}`);

                    let hasError = false;
                    for (const story of stories) {
                        const values = columns.map(col => col === 'isMock' ? 0 : story[col]);
                        stmt.run(values, (e) => {
                            if (e && !hasError) { hasError = true; console.error('Bulk Insert Error:', e); }
                        });
                    }
                    stmt.finalize();

                    db.run('COMMIT', (commitErr) => {
                        if (commitErr || hasError) return res.status(500).json({ error: commitErr?.message || 'Error during bulk insert' });
                        res.json({ success: true, inserted: stories.length });
                    });
                } catch (prepErr) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: prepErr.message });
                }
            });
        }
    );
});

// DELETE /api/seed/clear — remove all mock data (isMock=1) without touching real data
app.delete('/api/seed/clear', (req, res) => {
    const tables = ['jira_stories', 'projects', 'team_members', 'milestones', 'sprints', 'risks', 'leave_entries', 'weekly_reports'];
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        let done = 0;
        for (const table of tables) {
            db.run(`DELETE FROM ${table} WHERE isMock = 1`, (err) => {
                if (err) console.error(`Clear mock error on ${table}:`, err);
                done++;
                if (done === tables.length) {
                    db.run('COMMIT', () => res.json({ success: true, message: 'All mock data cleared.' }));
                }
            });
        }
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

// Milestone routes
app.get('/api/milestones', (req, res) => {
    const { projectId } = req.query;
    const sql = projectId ? `SELECT * FROM milestones WHERE projectId = ?` : `SELECT * FROM milestones`;
    const params = projectId ? [projectId] : [];
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/milestones', (req, res) => {
    const milestone = req.body;
    const columns = Object.keys(milestone);
    const placeholders = columns.map(() => '?').join(',');
    const updateCols = columns.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(', ');
    const sql = `INSERT INTO milestones (${columns.join(',')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updateCols}`;
    db.run(sql, Object.values(milestone), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/milestones/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    const sets = keys.map(k => `${k} = ?`).join(',');
    db.run(`UPDATE milestones SET ${sets} WHERE id = ?`, [...Object.values(updates), id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/milestones/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM milestones WHERE id = ?`, [id], (err) => {
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
    const { reportRowHtml, week, projectId } = req.body;
    try {
        const configPath = path.join(__dirname, '..', 'confluence-config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8')).confluence;
        const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');
        const url = `${config.baseUrl}/rest/api/content/${config.targetPageId}?expand=body.storage,version`;
        // Get current page
        const getRes = await fetch(url, { headers: { 'Authorization': `Basic ${auth}` } });
        if (!getRes.ok) {
            const errText = await getRes.text();
            throw new Error(`Failed to fetch Confluence page: ${getRes.status} ${errText}`);
        }
        const page = await getRes.json();
        // Duplicate check
        const storage = page.body && page.body.storage && page.body.storage.value ? page.body.storage.value : '';
        if (storage.includes(`>${week}<`) && storage.includes(`>${projectId}<`)) {
            return res.status(409).json({ error: 'Duplicate entry for this week and project' });
        }
        // Append row
        let content = storage;
        if (content.includes('</tbody>')) {
            const idx = content.lastIndexOf('</tbody>');
            content = content.substring(0, idx) + reportRowHtml + content.substring(idx);
        } else if (content.includes('</table>')) {
            const idx = content.lastIndexOf('</table>');
            content = content.substring(0, idx) + `<tbody>${reportRowHtml}</tbody>` + content.substring(idx);
        } else {
            content += `<table><thead><tr><th>Week</th><th>Project</th><th>RAG</th><th>Accomplishments</th><th>Next Week Plan</th><th>Risks & Mitigation</th><th>Blockers</th><th>Prepared By</th><th>Approved By</th><th>Updated</th></tr></thead><tbody>${reportRowHtml}</tbody></table>`;
        }
        // Update page
        const updateRes = await fetch(`${config.baseUrl}/rest/api/content/${config.targetPageId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                version: { number: page.version.number + 1 },
                title: page.title,
                type: 'page',
                body: { storage: { value: content, representation: 'storage' } }
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

app.post('/api/ai/summarize-weekly', async (req, res) => {
    const { projectId, week } = req.body;
    try {
        const configPath = path.join(__dirname, 'ai-config.json');
        let config;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8')).ai;
        } catch (e) {
            return res.status(500).json({ error: 'AI Configuration missing or invalid' });
        }

        db.all('SELECT * FROM jira_stories WHERE projectId = ? AND week = ?', [projectId, week], async (err, stories) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!stories || stories.length === 0) return res.status(400).json({ error: 'No stories found for this project & week' });

            const summaryPrompt = `
You are a TPM-input director. Analyze the following project update tracking information and generate a concise weekly summary.
Focus on identifying real progress, blockers, and next steps across teams based on descriptions, status, and comments.

Stories:
${stories.map(s => `- Title: ${s.title}
  Status: ${s.status}
  Story Points: ${s.storyPoints}
  Description: ${s.description || 'N/A'}
  Comments: ${s.comments || 'N/A'}
  Risks & Mitigation: ${s.risksMitigation || 'N/A'}
  Blockers: ${s.blockers || 'N/A'}
  Pulled Date: ${s.pulledDate || 'N/A'}`).join('\n\n')}

Please return ONLY a JSON object with strictly these keys:
{
  "accomplishments": "Brief summary of Completed/Done work...",
  "nextWeekPlan": "Brief summary of To Do/In Progress work and next actions...",
  "blockers": "Any risks/blockers identified..."
}`;

            try {
                const response = await fetch(config.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`
                    },
                    body: JSON.stringify({
                        model: config.model,
                        messages: [
                            { role: 'system', content: 'You are an expert TPM-input director.' },
                            { role: 'user', content: summaryPrompt }
                        ],
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const errData = await response.text();
                    throw new Error(`AI Provider Error: ${errData}`);
                }

                const data = await response.json();
                let output = data.choices[0].message.content.trim();

                // Try parsing JSON out of markdown blocks
                if (output.startsWith('\`\`\`json')) {
                    output = output.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
                } else if (output.startsWith('\`\`\`')) {
                    output = output.replace(/^\`\`\`/m, '').replace(/\`\`\`$/m, '').trim();
                }

                const parsed = JSON.parse(output);
                res.json(parsed);

            } catch (aiErr) {
                console.error('AI Request Error:', aiErr);
                res.status(500).json({ error: 'Failed to generate summary with AI' });
            }
        });
    } catch (err) {
        console.error('AI Summarize Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ai/suggest-mitigation', async (req, res) => {
    const { riskDescription } = req.body;
    if (!riskDescription) return res.status(400).json({ error: 'Risk description is required' });

    try {
        const configPath = path.join(__dirname, 'ai-config.json');
        let config;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8')).ai;
        } catch (e) {
            return res.status(500).json({ error: 'AI Configuration missing or invalid' });
        }

        const prompt = `You are a TPM-input director. Based on the following project risk, suggest a concise and actionable mitigation strategy (1-2 sentences max).\n\nRisk: ${riskDescription}\n\nReturn ONLY a JSON object with this key: { "mitigation": "..." }`;

        const response = await fetch(config.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: 'You are an expert TPM-input director.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`AI Error: ${errData}`);
        }

        const data = await response.json();
        let output = data.choices[0].message.content.trim();
        if (output.startsWith('```json')) output = output.replace(/^```json/m, '').replace(/```$/m, '').trim();
        else if (output.startsWith('```')) output = output.replace(/^```/m, '').replace(/```$/m, '').trim();

        const parsed = JSON.parse(output);
        res.json({ mitigation: parsed.mitigation });

    } catch (err) {
        console.error('AI Mitigation Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
