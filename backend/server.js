const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();
const path = require('path');

const app = express();

// FIX 1: Open CORS so Render doesn't block the connection
app.use(cors());
app.use(express.json());

const store = {};

const generateCodeVerifier = () => crypto.randomBytes(32).toString('base64url');
const generateCodeChallenge = (verifier) =>
    crypto.createHash('sha256').update(verifier).digest('base64url');

app.get('/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

app.get('/auth/login', (req, res) => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    store['verifier'] = verifier;

    // FIX 2: Dynamically grab the current URL (works for both localhost and Render)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const redirectUri = `${protocol}://${req.get('host')}/auth/callback`;

    const authUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize?` +
        `response_type=code` +
        `&client_id=${process.env.SF_CLIENT_ID}` +
        `&redirect_uri=${redirectUri}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256`;

    console.log('Auth URL:', authUrl);
    res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    const verifier = store['verifier'];

    // FIX 3: Match the dynamic redirect URI used in the login step
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const redirectUri = `${protocol}://${req.get('host')}/auth/callback`;

    try {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.SF_CLIENT_ID,
            client_secret: process.env.SF_CLIENT_SECRET,
            redirect_uri: redirectUri,
            code: code,
            code_verifier: verifier
        });

        const response = await axios.post(
            `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
            params.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, instance_url, id } = response.data;

        const identityResponse = await axios.get(id, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const username = identityResponse.data.username;

        const orgResponse = await axios.get(
            `${instance_url}/services/data/v59.0/query?q=SELECT+Name+FROM+Organization`,
            { headers: { Authorization: `Bearer ${access_token}` } }
        );
        const organizationName = orgResponse.data.records[0].Name;

        console.log(`Login successful! User: ${username}, Org: ${organizationName}`);

        // FIX 4: Send the user straight to the root domain ('/') instead of localhost:3000
        const redirectUrl = `/?access_token=${access_token}&instance_url=${encodeURIComponent(instance_url)}&username=${encodeURIComponent(username)}&organization=${encodeURIComponent(organizationName)}`;

        res.redirect(redirectUrl);

    } catch (error) {
        console.error('OAuth error:', error.response?.data || error.message);
        // Send back to root with error
        res.redirect('/?error=auth_failed');
    }
});

app.get('/api/validation-rules', async (req, res) => {
    const { access_token, instance_url } = req.headers;

    try {
        const response = await axios.get(
            `${instance_url}/services/data/v59.0/tooling/query?q=SELECT+Id,ValidationName,Active+FROM+ValidationRule+WHERE+EntityDefinition.QualifiedApiName='Account'`,
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        console.log('Raw response:', JSON.stringify(response.data));

        const rules = response.data.records.map(rule => ({
            Id: rule.Id,
            FullName: rule.ValidationName,
            Metadata: { active: rule.Active }
        }));

        console.log('Rules found:', rules.length);
        res.json(rules);
    } catch (error) {
        console.error('Fetch error:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/toggle-rule', async (req, res) => {
    const { access_token, instance_url } = req.headers;
    const { ruleId, active } = req.body;

    try {
        const getUrl = `${instance_url}/services/data/v59.0/tooling/sobjects/ValidationRule/${ruleId}`;
        const ruleResponse = await axios.get(getUrl, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const updatedMetadata = ruleResponse.data.Metadata;
        updatedMetadata.active = active;

        await axios.patch(
            getUrl,
            { Metadata: updatedMetadata },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Toggle error:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

// Serve the React frontend static files
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all route to hand off page routing back to React
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// FIX 5: Let Render dynamically set the Port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));