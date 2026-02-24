// Import routing for JIRA
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

function App() {
    return (
        <Router>
            <Switch>
                {/* Define your routes here */}
                <Route path="/jira" component={JiraComponent} />
                {/* Other routes */}
            </Switch>
        </Router>
    );
}
export default App;