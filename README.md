# Bhadke Family Tree

Interactive family tree — open `index.html` in a browser (no build step).

- **Edit family:** change `data.js` (name, `spouse`, `children`).
- **Features:** pan/zoom, click a person to highlight their lineage, search (`/`), collapse/expand branches, dark/light theme, mobile friendly.
- **Sections (header nav):** Tree, Path (root → me), Analysis (root, height, levels, degree, leaf / internal nodes, sibling groups), Generations, Statistics — all calculated from `data.js`, so they follow every edit.
- **Name / USN / TAE-II DMGT badge:** set your name, USN and `meId` (your person's id in `data.js`) in `student.js`.

## Editing (owner only)
Open the site with `#edit` at the end of the URL (e.g. `.../family-tree/#edit`). Every card then has a small button bar on top: ✎ rename, add child, ♥ add partner, 🗑 delete (on a partner card: ✎ rename, add child, 🗑 remove partner).
Changes stay in your browser as a draft. Click **Export data.js** (asks for the edit password), then upload it to GitHub to publish.
Visitors cannot change what others see — only someone who can commit to this repo can.
First time: click Export, choose a password, paste the line it shows into `auth.js`, commit.
