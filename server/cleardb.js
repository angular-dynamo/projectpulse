const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Clearing database at:', dbPath);

db.serialize(() => {
    const tables = ['jira_stories', 'projects', 'team_members', 'milestones', 'sprints', 'risks', 'leave_entries', 'weekly_reports'];
    tables.forEach(t => {
        db.run(`DELETE FROM ${t}`, err => {
            if (err) console.error(`Error clearing ${t}:`, err.message);
            else console.log(`✓ Cleared: ${t}`);
        });
    });

    // Try to clear users if table exists
    db.run(`DELETE FROM users WHERE id != 'admin0'`, err => {
        if (err && !err.message.includes('no such table')) {
            console.error('Error clearing users:', err.message);
        } else if (!err) {
            console.log('✓ Users: kept admin0 only');
        }
    });

    db.close(() => {
        console.log('\nDatabase cleared. Ready for fresh Excel upload.');
    });
});
