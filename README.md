# todos-habits

A little tasks and habit tracker I run on my own machine and open from my phone over Tailscale. No accounts, no cloud, no tracking. Everything lives in one SQLite file that never leaves the box it runs on.

There are two views you flip between with the toggle up top:

- **Tasks** is a stripped down Todoist. Type a task in plain language and it figures out the date and priority.
- **Habits** borrows the RPG stuff from Habitica. You gain XP and gold, level up, keep streaks going, and take damage when you skip a daily.

## Tasks

The add box parses what you type, so you don't have to click around for a date picker:

- `call mom tomorrow p1`
- `pay rent in 3 days`
- `finish the deck friday p2`
- `dentist sep 20`

`today`, `tomorrow`, weekday names, `next monday`, `in N days`, `sep 20`, `20 sep` and plain `2026-09-20` all work. `p1` through `p4` set the priority (p1 is the urgent red one). Whatever it can't parse just stays in the title.

Tasks group into Today, Upcoming, Inbox and All, and you can spin up your own projects. Overdue stuff floats to the top in red. Tap a task to edit the date, priority, project or note.

## Habits

Two kinds of things live here. Habits are the good-or-bad ones you tap a plus or minus on whenever they happen, and their color drifts from red to blue depending on how you're doing. Dailies are the ones that reset every day (or only on the days you pick), keep a streak, and cost you health if you leave them unchecked when the day rolls over.

Completing things pays out XP and gold scaled by difficulty. Fill the XP bar and you level up and heal. Let your health hit zero and you drop a level, so keep up with the dailies.

## Running it

You need Node 22.5 or newer. That's the only requirement. The database is Node's built in SQLite, so there's no native build step, no separate database to install, and no Docker.

```bash
npm install
npm run dev
```

Open http://localhost:5179 and start adding things. Your data is written to `server/data/app.db`. Back it up by copying that file somewhere.

## Getting to it from your phone (Tailscale)

The dev server binds on every interface, so anything on your tailnet can reach it. Nothing is exposed to the public internet and there's no port forwarding.

1. Have Tailscale running on this machine and on your phone, on the same tailnet.
2. On the phone, open `http://<this-machine>.ts.net:5179`, or use the tailnet IP from `tailscale ip`, like `http://100.x.y.z:5179`.

The API stays on localhost and the web app proxies `/api` to it, so only the page itself is reachable over the tailnet.

## Running it for real

For an always-on setup, build the client once and let the server hand out both the page and the API on a single port (5180):

```bash
npm run build
npm start
```

That one process binds on all interfaces too, so the Tailscale address works the same way.

## A note on security

There's no login, on purpose. It's meant to sit on a machine you own and be reached over a network you trust, like your tailnet or your home LAN, so don't put the port on the open internet. The database and your `.env` are gitignored and stay local.

## Stack

React, Vite, TypeScript and Tailwind on the front. Fastify, TypeScript and Node's built in SQLite on the back. Two small workspaces in one repo.

## License

MIT, see [LICENSE](LICENSE).
