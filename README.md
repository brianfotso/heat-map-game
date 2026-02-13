# Defeat the Heat

Interactive browser game built with plain HTML, CSS, and JavaScript.

## Run

```bash
node server.js
```

Open:

```text
http://localhost:3000
```

## Gameplay

1. Paint predicted hotspots on the dashboard.
2. Click **Score My Prediction**.
3. View your accuracy, overlap, and misses.
4. Save your score to the local leaderboard.
5. Generate a downloadable share card.

## Files

- `index.html`: UI structure
- `styles.css`: visual styling and responsive layout
- `script.js`: game logic, scoring, leaderboard, sharing
- `data/actual-heatmap.json`: synthetic real heatmap points
- `server.js`: zero-dependency static file server
