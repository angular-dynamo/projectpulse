import axios from 'axios';

class JiraService {
    constructor(baseURL, auth) {
        this.client = axios.create({
            baseURL,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async getIssue(issueKey) {
        try {
            const response = await this.client.get(`/issue/${issueKey}`);
            return response.data;
        } catch (error) {
            throw new Error(`Error fetching issue: ${error.message}`);
        }
    }

    async createIssue(issueData) {
        try {
            const response = await this.client.post('/issue', issueData);
            return response.data;
        } catch (error) {
            throw new Error(`Error creating issue: ${error.message}`);
        }
    }

    // Additional methods can be added here for updates, comments, etc.
}

export default JiraService;