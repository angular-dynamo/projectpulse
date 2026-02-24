const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'confluence-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8')).confluence;
const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');
const body = JSON.stringify({
    reportRowHtml: '<tr><td>2026-W09</td><td>PROJ</td></tr>',
    week: '2026-W09',
    projectId: 'PROJ'
});
fetch('http://127.0.0.1:3001/api/confluence/publish', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
    },
    body
})
    .then(res => res.json().then(data => console.log('Status', res.status, data)))
    .catch(err => console.error('Error', err));
