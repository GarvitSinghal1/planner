# 🎓 Academic Planner

A modern, feature-rich, and beautiful academic planner designed to help you organize your school, coaching, and self-study tasks. This web application is built with vanilla HTML, CSS (using Tailwind CSS), and JavaScript, and it syncs your tasks directly with a GitHub repository.

**[Live Demo](https://garvitsinghal1.github.io/schelduler/)**

![Academic Planner Screenshot](placeholder.png)
*(Note: You can replace `placeholder.png` with a screenshot of the application.)*

---

## ✨ Features

This planner is packed with features to maximize your productivity:

*   **GitHub Sync:** Securely saves and loads your task data from a `tasks.json` file in a dedicated GitHub repository.
*   **Multiple Views:**
    *   **Task Grid:** A flexible grid view of all your tasks.
    *   **Calendar:** View tasks by Day, Week, or Month.
    *   **Dashboard:** Visualize your productivity with charts showing task completion and type distribution.
    *   **History:** An archive of all your completed tasks.
*   **Advanced Task Management:**
    *   **Sub-tasks:** Break down large tasks into smaller, manageable sub-tasks with a progress bar.
    *   **Recurring Tasks:** Set tasks to repeat daily, weekly, or monthly.
    *   **Dynamic Priority:** Task priority automatically increases as the due date approaches.
*   **Intelligent Suggestions:** A "Suggest Task" feature recommends what you should work on next based on urgency, priority, and difficulty.
*   **Filtering & Search:** Easily find tasks by type, subject, date range, or a search query.
*   **Customization & UI:**
    *   **Dark/Light Mode:** Switch between themes for your comfort.
    *   **Drag-and-Drop:** Reorder your tasks with a simple drag-and-drop interface.
    *   **Responsive Design:** Looks and works great on both desktop and mobile devices.
*   **Export:** Save your task list or dashboard as a PDF file.
*   **Notifications:** Get browser notifications for tasks that are due soon.

---

## 🛠 Tech Stack

*   **Frontend:** HTML, CSS, JavaScript
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Charts:** [Chart.js](https://www.chartjs.org/)
*   **PDF Export:** [jsPDF](https://github.com/parallax/jsPDF)
*   **Drag & Drop:** [SortableJS](https://sortablejs.github.io/Sortable/)
*   **Deployment:** [GitHub Pages](https://pages.github.com/)
*   **Automation:** [GitHub Actions](https://github.com/features/actions)

---

## 🚀 Setup and Deployment

### 1. Prerequisites

*   A GitHub Account.
*   Two GitHub repositories:
    1.  A repository for the application code (this one).
    2.  A separate, empty repository to store the `tasks.json` data file (e.g., `adcplannerDATA`).

### 2. Configuration

To get the application running and syncing with your GitHub account, follow these steps:

#### A. Configure `script.js`

Open the `script.js` file and update the following constants with your details:

```javascript
const GITHUB_USERNAME = 'YOUR_GITHUB_USERNAME';
const GITHUB_REPO = 'YOUR_DATA_REPO_NAME'; // e.g., 'adcplannerDATA'
const FILE_PATH = 'data/tasks.json'; // You can leave this as is
```

#### B. Create a Personal Access Token (PAT)

The application uses the GitHub API to write data. You need to create a Personal Access Token with the correct permissions.

1.  Go to **GitHub Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
2.  Click **"Generate new token"**.
3.  Give it a descriptive name (e.g., `ADCPLANNER_TOKEN`).
4.  Set an expiration date.
5.  Under **"Select scopes,"** check the **`repo`** scope. This is essential for the app to read and write files to your repository.
6.  Click **"Generate token"** and copy the token immediately. You won't be able to see it again.

#### C. Add the Token as a GitHub Secret

To keep your token secure, we use GitHub Actions to inject it during deployment.

1.  In your **application code repository**, go to **Settings** > **Secrets and variables** > **Actions**.
2.  Click **"New repository secret"**.
3.  For the **Name**, enter `TOKEN_GITHUB`.
4.  For the **Secret**, paste the Personal Access Token you just created.
5.  Click **"Add secret"**.

### 3. Deployment

The project is set up to deploy automatically to GitHub Pages whenever you push a change to the `main` branch.

1.  Commit and push your configured code to your application repository.
2.  Go to the **"Actions"** tab in your repository to monitor the deployment workflow.
3.  Once the workflow is complete, go to **Settings** > **Pages**. Your site should be live at `https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_CODE_REPO_NAME>/`.

---

*This project was created as part of the Academic Planner project brief.* 