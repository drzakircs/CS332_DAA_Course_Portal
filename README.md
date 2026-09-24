# CS332 — Design and Analysis of Algorithms

GitHub Pages course-material portal for **CS332 — Design and Analysis of Algorithms**, Fall 2026, BS Computer Science.

**Instructor:** Dr. Zakir Khan  
**Designation:** Assistant Professor, Department of Computer Science  
**Campus:** Air University Aerospace & Aviation Campus, Kamra

The portal is designed so weekly HTML learning material can be uploaded to `materials/` without manually editing `index.html`, `app.js`, `course.json`, or the weekly plan.

## Project structure

```text
CS332_DAA_Course_Portal/
│
├── index.html
├── 404.html
├── README.md
│
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
│
├── data/
│   └── course.json
│
└── materials/
    └── README.md
```

## Upload new learning material

The normal instructor workflow is only:

1. Create the HTML learning material.
2. Include the appropriate week number in the filename.
3. Upload the file into `/materials/`.
4. Commit the change to the configured Pages branch.
5. GitHub Pages rebuilds the site and the material appears automatically under the matching week.

Example:

```text
CourseName_Week03_Lecture.html
CourseName_Week03_Examples.html
CourseName_Week03_Practice.html
```

All three files automatically appear under **Week 03**.

## Supported week filename conventions

The detector is case-insensitive and supports:

```text
Week1
Week01
Week_1
Week_01
Week-1
Week-01
week 1
week 01
```

Examples:

```text
CS332_Week1.html
CS332_Week01_Lecture.html
CS332_Week02_CodeExamples.html
CS332_Week02_Practice.html
CS332_week 03_Interactive Material.html
```

Only `.html` and `.htm` files are treated as learning material.

## Multiple files in one week

Any number of matching files can be uploaded for a week. They are naturally sorted by filename. Each row contains:

- `View` — loads the material in the embedded viewer on the same page.
- `Open` — opens the material in a new browser tab.

If no file exists for a week, the card displays only:

```text
LEARNING MATERIAL    Not uploaded yet
```

## Long filenames

`View` and `Open` remain fixed and visible. A long display name stays inside the available filename viewport and moves horizontally from right to left only when it overflows. Short filenames do not animate. Motion is reduced for users who request reduced motion in their operating system/browser settings.

The actual repository filename is never renamed.

## Display-name cleanup

The interface removes `.html` / `.htm`, displays from the `Week...` portion when possible, replaces `_` and `-` separators with spaces, and splits common CamelCase names.

For example:

```text
CS332_Design_and_Analysis_of_Algorithms_Week02_CodeExamples.html
```

appears approximately as:

```text
Week02 Code Examples
```

## Delete material

1. Delete the HTML file from `/materials/`.
2. Commit the deletion.
3. GitHub Pages rebuilds automatically.
4. If no material remains for that week, the week displays `Not uploaded yet`.

## Replace material

1. Keep the same filename if the listing should stay unchanged.
2. Replace the file contents in `/materials/`.
3. Commit the update.
4. GitHub Pages republishes the latest version.

Rename the actual file only if you want its displayed title/order to change.

## Automatic material discovery

### Primary: GitHub Pages / Jekyll

`index.html` uses Jekyll/Liquid and `site.static_files` at build time to discover HTML files inside `/materials/`. Normal student page loads therefore do **not** require a GitHub API call.

### Fallback: GitHub API

For a non-Jekyll/local/static-hosting setup, JavaScript can use the GitHub Contents API for discovery.

Configure these constants near the top of `assets/js/app.js`:

```javascript
const GITHUB_REPO = 'USERNAME/REPOSITORY';
const GITHUB_BRANCH = 'main';
const MATERIALS_DIR = 'materials';
```

Replace `USERNAME/REPOSITORY` only when the actual GitHub username and repository name are known. The fallback intentionally remains disabled while placeholders are present.

## Enable GitHub Pages

1. Create/open the GitHub repository.
2. Upload this project to the repository root.
3. Open **Repository → Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select **main**.
6. Select **/(root)**.
7. Save.
8. Wait for the Pages deployment to finish.

No Node.js, npm, backend server, database, PHP, or Python runtime is required.

## Update repository configuration

If the GitHub API fallback is required, edit only `assets/js/app.js`:

```javascript
const GITHUB_REPO = 'your-username/your-repository';
const GITHUB_BRANCH = 'main';
const MATERIALS_DIR = 'materials';
```

The standard GitHub Pages/Jekyll deployment works independently of this API configuration.

## Weekly plan data

The complete 15-week / 45-session plan is stored in:

```text
data/course.json
```

Each week contains its number, concise week focus, CLO alignment, three theory sessions, detailed coverage, learning/class activity, and assessment status.

The source course log does not provide a dedicated CLO column for every session. Therefore, weekly CLO badges are transparent alignments derived from the approved CLO definitions and explicit CLO–assessment mapping. Session topics, activities, and assessment placement are transcribed from the course guide.

## Search

The weekly-plan search covers:

- week number;
- week focus;
- session topic;
- theory coverage/subtopic text;
- learning/class activity;
- CLO;
- assessment text;
- uploaded learning-material filename/path.

Only matching weekly cards remain visible.

## Cache handling

The site includes simple cache-busting parameters:

```html
assets/css/style.css?v=1
assets/js/app.js?v=1
```

When making a major CSS/JavaScript change, increment the version, for example from `v=1` to `v=2`.

## Course-source fidelity

The course metadata, approved CLOs, GA mapping, assessment weights, assessment calendar, prerequisites, references, and 45-session teaching log come from the supplied CS332 course guide. The guide does not prescribe a specific programming language/tool for this theory course, so none has been invented for the course sheet.
