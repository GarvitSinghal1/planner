🎓 Academic Planner App – Project Brief
🔧 Versions Required:
Web App Version

Deployable via GitHub Pages

Fully functional in the browser

Reads and writes data from a file stored on GitHub (e.g. JSON)

Desktop GUI Version

Works on a local PC (Windows preferred)

GitHub-hosted JSON for data storage

🎯 Core Features:
✅ Visual UI Requirements
A modern, clean and beautiful UI

Color-coding for different types of tasks:

🔵 School

🟢 Coaching

🟡 Self-study

Additional color tags for priority levels:

🔴 High

🟠 Medium

⚪ Low

UI must feel polished: gradients, subtle animations, responsive layout (for web version)

📅 Functional Requirements
Add/Edit/Delete tasks or study blocks

Each task should include:

Title

Type (school, coaching, self-study)

Priority

Submission/Due date

Notes (optional)

View by Day / Week / Month modes (if possible)

Data should persist via:

A GitHub file (e.g. data.json) for the web version

same GitHub method for the desktop version

🛠 Tech Stack (Suggested)
Web Version:

HTML, CSS (Tailwind or any modern framework), JS (Vanilla or React)

Fetch GitHub JSON using GitHub API (read/write if possible)

Desktop Version:

Python with Tkinter or PyQt5 / ElectronJS

GitHub API integration for sync

📂 GitHub Integration
Use GitHub to store a data.json file:

The app should read this file at launch

write back to it (via GitHub API or user uploading new file)

🎁 Bonus (Optional but cool)
Drag-and-drop to reorder tasks

Dark mode / Light mode

Search or filter by subject, type, or date

Export to PDF or image

📌 Final Deliverables:
✅ Source code for both versions

✅ GitHub repository with web version live via GitHub Pages

✅ README file with instructions

✅ Any design assets (Figma, fonts, icons)