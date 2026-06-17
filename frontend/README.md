Markdown
# Salesforce Validation Rule Manager ☁️

A full-stack web application designed to streamline Salesforce administration. This tool provides a clean, fast React interface to view, enable, and disable validation rules on the Account object without needing to navigate through the standard Salesforce Setup menus. 

It is particularly useful during data migrations or bulk updates when certain automations need to be temporarily bypassed.

## 🚀 Features
* **Secure OAuth 2.0 Authentication:** Connects directly to any Salesforce Org securely.
* **Live Data Fetching:** Pulls real-time validation rule metadata using the Salesforce Tooling API.
* **One-Click Toggles:** Activate or deactivate individual rules instantly.
* **Bulk Actions:** "Activate All" and "Deactivate All" functionality for rapid migrations.
* **Zero Data Retention:** The application only reads and writes metadata flags; no organization data is captured or stored.

## 💻 Tech Stack
* **Frontend:** React.js, standard CSS (Salesforce Lightning Design System inspired)
* **Backend:** Node.js, Express.js
* **Integration:** `jsforce`, Axios, Salesforce REST API, Tooling API

---

## 🛠️ How to Run This Project Locally

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.
* A Salesforce Developer Edition Org or Trailhead Playground.

### 1. Salesforce Connected App Setup
To allow this app to communicate with your Salesforce Org, you must create a Connected App:
1. Log into your Salesforce Org.
2. Navigate to **Setup** > **App Manager** > **New Connected App**.
3. Fill in the required basic information.
4. Enable **OAuth Settings**.
5. Set the Callback URL exactly to: `http://localhost:4000/auth/callback`
6. Under Selected OAuth Scopes, add:
   * *Manage user data via APIs (api)*
   * *Perform requests at any time (refresh_token, offline_access)*
7. Save the app. Note your **Consumer Key** (Client ID) and **Consumer Secret**. *(Note: It may take up to 10 minutes for a new Connected App to become active).*

### 2. Backend Setup
1. Clone this repository and open your terminal.
2. Navigate into the backend directory:
   ```bash
   cd backend
Install the required Node dependencies:

Bash
npm install
Rename the .env.example file to .env.

Open the .env file and paste your specific Salesforce credentials:

Plaintext
SF_CLIENT_ID=your_consumer_key_here
SF_CLIENT_SECRET=your_consumer_secret_here
SF_LOGIN_URL=[https://login.salesforce.com](https://login.salesforce.com) 
(Note: If using a Sandbox, change the URL to https://test.salesforce.com)

Start the backend server:

Bash
node server.js
The backend should now be running on http://localhost:4000.

3. Frontend Setup
Open a new terminal window and navigate to the frontend directory:

Bash
cd frontend
Install the React dependencies:

Bash
npm install
Start the React development server:

Bash
npm start
The frontend should now open in your browser at http://localhost:3000.

4. Usage
On the web app, select your environment (Production/Developer vs. Sandbox).

Click Login.

Authorize the application in the Salesforce popup.

Click Get Validation Rules to load and manage your Account rules!

Developed by @Atul