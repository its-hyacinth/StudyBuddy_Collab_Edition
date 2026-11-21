# StudyBuddy

A fully static **student / teacher study & class management** demo built with **HTML, CSS, and vanilla JavaScript**. Data persists in `localStorage` so the app works offline without a server framework.

## Quick start

1. Start Apache and MySQL in XAMPP.
2. The MySQL database is `Studybuddy`. Import `Studybuddy.sql` in phpMyAdmin if it is not already there.
3. Open `http://localhost/StudyBuddy_Collab_Edition/`.
4. Create an account on the sign-up page. Sign-in uses that email and password.
5. Optional: Settings → Privacy (student) or Security (teacher) → **Set up Google Authenticator**. After that, sign-in asks for the 6-digit code.
6. Optional: put a Google OAuth **Web client ID** in `config/google.php` to enable **Continue with Google**. Authorized JavaScript origins must include `http://localhost`.

Demo buttons do not sign you in. Email password reset is not configured.

## Project structure

```
studybuddy/
├── index.html / signup.html
├── student/          # Student portal pages
├── teacher/          # Teacher (admin) portal pages
├── assets/           # logo, wallpaper, login illustration
├── css/              # style.css, components.css, pages.css
└── js/               # data, auth, sidebar, google-integration, page scripts
```

## Features

| Role | Highlights |
|------|------------|
| **Student** | Dashboard, Subjects, Assignments, To-Do, Schedule, Progress, Google Drive (mock), Settings |
| **Teacher** | Dashboard, Classes, Assignments, Grades, Students, Messages, Calendar, Resources, Settings |

- Role-based sidebar and session (`studybuddy_user`, `studybuddy_role`)
- CRUD for subjects, assignments, tasks, schedule via `localStorage`
- Filter tabs, search, pagination, modals, toasts
- Google Classroom as the class source (COR-based catalog; live API when an OAuth client ID is set)
- Optional Google Drive file view; Calendar is secondary to Classroom

## Classes (CTU Consolacion · BSIT 4)

Demo subjects follow Certificate of Registration, 1st Semester SY 2026-2027, section `BSIT_DAY_4-B`. Professors stay **TBA** until Google Classroom returns teacher names.

## Google Classroom integration

Classes, teachers, and coursework sync from **Google Classroom** (`js/google-integration.js`):

- **Without a client ID:** Sync imports the enrolled COR catalog (rooms/professors TBA).
- **With a client ID:** Settings → Connected Accounts → paste a Google Cloud OAuth Client ID. Authorized JavaScript origins must include this site. Scopes: `classroom.courses.readonly`, `classroom.coursework.me.readonly`, `classroom.rosters.readonly`.

Suggested production backend (optional later):

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/login` | Session / JWT |
| `/api/google/oauth/start` | Begin OAuth consent |
| `/api/google/oauth/callback` | Store refresh tokens |
| `/api/google/classroom/sync` | Pull courses, teachers, coursework |
| `/api/google/drive/sync` | List / upload files |
| `/api/subjects`, `/api/assignments`, … | CRUD replacing `localStorage` |

## Design system

CSS custom properties in `css/style.css` (`--primary: #2563EB`, `--sidebar-bg: #0F1E3D`, etc.). Layout: fixed navy sidebar (~250px), sticky header, main + right widget column. Responsive under 900px (hamburger drawer).

## Resetting demo data

Settings → Data & Storage → **Clear / Reset demo data**, or in the browser console:

```js
Object.keys(localStorage).filter(k => k.startsWith('studybuddy')).forEach(k => localStorage.removeItem(k));
location.reload();
```

## License

Demo / educational project for StudyBuddy proof-of-concept UI.
