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
  `);

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
      completedAt TEXT
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
      preparedBy TEXT,
      approvedBy TEXT,
      status TEXT,
      approvalComment TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);
});

module.exports = db;
