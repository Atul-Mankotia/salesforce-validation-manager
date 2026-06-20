import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [instanceUrl, setInstanceUrl] = useState(null);

  // State for user details
  const [username, setUsername] = useState('');
  const [organization, setOrganization] = useState('');

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [environment, setEnvironment] = useState('Production');

  // State to control when to show the table vs the intermediate "Logged In" screen
  const [showTable, setShowTable] = useState(false);

  // Check if we're back from Salesforce login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    const url = params.get('instance_url');

    // Dynamically grabbing the user details from the backend redirect
    const user = params.get('username') || '';
    const org = params.get('organization') || '';

    if (token && url) {
      setAccessToken(token);
      setInstanceUrl(decodeURIComponent(url));
      setUsername(user);
      setOrganization(org);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleLogin = () => {
    window.location.href = `/auth/login?env=${environment}`;
  };

  const handleLogout = () => {
    // Clear all state to simulate logout
    setAccessToken(null);
    setInstanceUrl(null);
    setUsername('');
    setOrganization('');
    setRules([]);
    setShowTable(false);
    setMessage('');
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/validation-rules', {
        headers: {
          'access_token': accessToken,
          'instance_url': instanceUrl
        }
      });
      const data = await response.json();
      setRules(data);
      setMessage(`Found ${data.length} validation rules.`);
      setShowTable(true); // Show table after fetching
    } catch (error) {
      setMessage('Error fetching rules.');
    }
    setLoading(false);
  };

  const toggleRule = async (ruleId, newActive, fullName) => {
    try {
      const response = await fetch('/api/toggle-rule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': accessToken,
          'instance_url': instanceUrl
        },
        body: JSON.stringify({
          ruleId: ruleId,
          active: newActive
        })
      });

      const data = await response.json();

      if (data.success) {
        setRules(prevRules => prevRules.map(r =>
          r.Id === ruleId
            ? { ...r, Metadata: { ...r.Metadata, active: newActive } }
            : r
        ));
        setMessage(`Rule ${fullName} ${newActive ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      setMessage('Error toggling rule.');
    }
  };

  const toggleAllRules = async (targetActiveState) => {
    setMessage(`Processing all rules...`);
    for (const rule of rules) {
      if (rule.Metadata.active !== targetActiveState) {
        await toggleRule(rule.Id, targetActiveState, rule.FullName);
      }
    }
    setMessage(`All rules ${targetActiveState ? 'activated' : 'deactivated'}!`);
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="top-nav">
        <div className="nav-left">
          <div className="logo-placeholder">VR</div>
          <span className="brand-name">Salesforce Toolkit</span>
        </div>
        <div className="nav-right">
          <button className="btn-donate">Donate</button>
          <a href="#source" className="nav-link">Source Code</a>
          <a href="#handle" className="nav-link">@Atul</a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="landing-container">
          <h1 className="landing-title">Validation Rule Manager</h1>
          <p className="landing-description">
            This tool provides an interface to easily enable and disable validation rules on the Account object in your Salesforce Org. Very useful when doing data migrations and needing to bypass certain automation.
            <br /><br />
            None of your organization information or data is captured or kept from running this tool.
          </p>

          {!accessToken ? (
            /* PRE-LOGIN CONTROLS */
            <div className="login-controls">
              <label className="env-label">Environment</label>
              <select
                className="env-select"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              >
                <option value="Production">Production</option>
                <option value="Sandbox">Sandbox</option>
              </select>
              <button className="btn-login" onClick={handleLogin}>
                LOGIN
              </button>
            </div>
          ) : (
            /* POST-LOGIN DETAILS & ACTION BUTTONS */
            <div className="user-details-section">
              <h3 className="user-details-heading">Logged in as:</h3>
              <div className="user-info-grid">
                <span className="info-label">Username:</span>
                <span className="info-value">{username}</span>
                <span className="info-label">Organisation:</span>
                <span className="info-value">{organization}</span>
              </div>

              <div className="action-buttons">
                <button className="btn-login" onClick={handleLogout}>
                  LOGOUT
                </button>
                <button className="btn-login" onClick={fetchRules} disabled={loading}>
                  {loading ? 'LOADING...' : 'GET VALIDATION RULES'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DATA TABLE SECTION (Only shows after clicking Get Rules) */}
        {showTable && (
          <div className="dashboard-container" style={{ marginTop: '40px' }}>
            <div className="dashboard-header">
              <h2 className="dashboard-title">Manage Account Rules</h2>
              <span className="connected-badge">✅ Connected</span>
            </div>

            <div className="controls-row">
              {rules.length > 0 && (
                <>
                  <button className="btn-success" onClick={() => toggleAllRules(true)}>
                    Activate All
                  </button>
                  <button className="btn-danger" onClick={() => toggleAllRules(false)}>
                    Deactivate All
                  </button>
                </>
              )}
            </div>

            {message && <p className="status-message">{message}</p>}

            {rules.length > 0 && (
              <div className="table-wrapper">
                <table className="rules-table">
                  <thead>
                    <tr>
                      <th>Rule Name</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(rule => (
                      <tr key={rule.Id}>
                        <td>{rule.FullName}</td>
                        <td>
                          <span className={`status-badge ${rule.Metadata.active ? 'status-active' : 'status-inactive'}`}>
                            {rule.Metadata.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn-action ${rule.Metadata.active ? 'btn-action-deactivate' : 'btn-action-activate'}`}
                            onClick={() => toggleRule(rule.Id, !rule.Metadata.active, rule.FullName)}
                          >
                            {rule.Metadata.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}