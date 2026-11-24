# Cardiac Scores

An offline cardiology risk-score app for Prof. Yasser Baghdady.
Live: https://yasserbaghdady.github.io/cardiac-scores/

Enter a patient once and every score reads what it needs. Nothing leaves the
device; the app installs to a phone or PC and runs with no connection.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest`, `icon*` | the built app, served by GitHub Pages |
| `src/` | source: `engine-core.js` and `engine-extra.js` (the equations), `scores.js` (field registry and score definitions), `app.js`, `app.css`, `index.html` (UI) |
| `tests/run.js` | the test suite, including every official-calculator result the app has been checked against |
| `build.py` | runs the tests, then writes the built app |

## Building

```
python3 build.py        # tests must pass or nothing is written
```

It writes `dist/index.html` (single file) and `dist/pwa/` (installable version).
Copy the contents of `dist/pwa/` to the repository root to publish.
`tests/run.js` needs `tests/old-engine.js`, which is `src/engine-core.js` with
`module.exports = RS;` appended; it is used to prove the ported equations still
match the original clinic tool.

## Adding a score

Each score is one entry in `scores.js`: which inputs it reads, how it computes,
how it is categorised, the guideline action, its source and its check status.
One engine renders them all, so a new score costs about the same as any other.
Every score is checked against its official calculator where one exists, and the
results are kept in `tests/run.js` so a later change cannot silently break them.

Results support, and do not replace, clinical judgement.
