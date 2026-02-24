const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

// Initialize schema
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT,
      code TEXT,
      ownerId TEXT,
      status TEXT,
      ragStatus TEXT,
      startDate TEXT,
      endDate TEXT,
      budget INTEGER,
      budgetSpent INTEGER,
      description TEXT,
      projectType TEXT DEFAULT 'scrum'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT,
      role TEXT,
      appRole TEXT,
      avatar TEXT,
      email TEXT,
      totalHoursPerWeek INTEGER
    )
  `, () => {
    // ── Default admin user — always present, not part of mock data ──
    db.run(`
      INSERT OR IGNORE INTO team_members (id, name, role, appRole, avatar, email, totalHoursPerWeek)
      VALUES ('admin0', 'Admin User', 'System Administrator', 'admin', 'AU', 'admin@acme.com', 40)
    `);
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS jira_stories (
      id TEXT PRIMARY KEY,
      title TEXT,
      assigneeId TEXT,
      storyPoints INTEGER,
      status TEXT,
      epic TEXT,
      sprint TEXT,
      week TEXT,
      projectId TEXT,
      createdAt TEXT,
      startedAt TEXT,
      completedAt TEXT,
      description TEXT,
      acceptanceCriteria TEXT,
      comments TEXT,
      pulledDate TEXT,
      risksMitigation TEXT,
      blockers TEXT,
      aiMitigation TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      title TEXT,
      targetDate TEXT,
      actualDate TEXT,
      status TEXT,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sprints (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      name TEXT,
      startDate TEXT,
      endDate TEXT,
      plannedPoints INTEGER,
      completedPoints INTEGER,
      week TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS risks (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      title TEXT,
      description TEXT,
      probability TEXT,
      impact TEXT,
      mitigation TEXT,
      ownerId TEXT,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leave_entries (
      id TEXT PRIMARY KEY,
      memberId TEXT,
      week TEXT,
      hoursOff INTEGER,
      type TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS weekly_reports (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      week TEXT,
      ragStatus TEXT,
      accomplishments TEXT,
      nextWeekPlan TEXT,
      blockers TEXT,
      risksMitigation TEXT,
      preparedBy TEXT,
      approvedBy TEXT,
      status TEXT,
      approvalComment TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  // Migrations for existing database
  db.run(`ALTER TABLE jira_stories ADD COLUMN description TEXT`, (err) => { /* ignore if exists */ });
  db.run(`ALTER TABLE jira_stories ADD COLUMN acceptanceCriteria TEXT`, (err) => { /* ignore */ });
  db.run(`ALTER TABLE jira_stories ADD COLUMN comments TEXT`, (err) => { /* ignore */ });
  db.run(`ALTER TABLE jira_stories ADD COLUMN pulledDate TEXT`, (err) => { /* ignore */ });
  db.run(`ALTER TABLE jira_stories ADD COLUMN risksMitigation TEXT`, (err) => { /* ignore */ });
  db.run(`ALTER TABLE jira_stories ADD COLUMN blockers TEXT`, (err) => { /* ignore */ });
  db.run(`ALTER TABLE jira_stories ADD COLUMN aiMitigation TEXT`, (err) => { /* ignore */ });
  db.run(`ALTER TABLE milestones ADD COLUMN startDate TEXT`, (err) => { /* ignore if exists */ });
  db.run(`ALTER TABLE weekly_reports ADD COLUMN risksMitigation TEXT`, (err) => { /* ignore if exists */ });

  // ── isMock flag: 1 = seeded demo data, 0 = real user data ──────────────────
  db.run(`ALTER TABLE projects ADD COLUMN isMock INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
  db.run(`ALTER TABLE team_members ADD COLUMN isMock INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
  db.run(`ALTER TABLE jira_stories ADD COLUMN isMock INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
  db.run(`ALTER TABLE milestones ADD COLUMN isMock INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
  db.run(`ALTER TABLE sprints ADD COLUMN isMock INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
  db.run(`ALTER TABLE risks ADD COLUMN isMock INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
  db.run(`ALTER TABLE leave_entries ADD COLUMN isMock INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
  db.run(`ALTER TABLE weekly_reports ADD COLUMN isMock INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
});

module.exports = db;
