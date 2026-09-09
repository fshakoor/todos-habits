# todos-habits

A little tasks and habit tracker I run on my own machine and open from my phone over Tailscale. No accounts, no cloud, no tracking. Everything lives in one SQLite file on my box.

Two views you flip between: a tasks list (a stripped down Todoist) and a habit tracker with the RPG bits from Habitica (level up, gold, streaks, the whole thing).

## Running it

Needs Node 22.5+. That's it, the database is Node's built in SQLite so there's nothing to install or build.

```bash
npm install
npm run dev
```

Then open http://localhost:5179.

More docs coming as I build this out.
