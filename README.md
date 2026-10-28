# SFU Courses

Explore and schedule SFU courses with the best user experience.

## Features

- **Explore:** Robust course filtering, past instructor/offering data, and Reddit insights.
- **Graph:** Interactive force-directed graph to visualize SFU course prerequisites.
- **Schedule:** Fast, clash-free schedule maker with `.ics` export and image sharing.
- **Progress Track:** Visualize and plan your degree progress.

## Tech Stack

- Next.js
- TypeScript
- SCSS
- React Query

## Quick Start

```shell
git clone https://github.com/brianrahadi/sfucourses.git
cd sfucourses
npm install
npm run dev
```

To develop against a local [sfucourses-api](https://github.com/brianrahadi/sfucourses-api), set `SFUCOURSES_API_URL=http://localhost:8080`.

### Loading skeletons

Course, instructor and explore pages show skeletons captured from the real UI
(stored in `src/bones/`, in [boneyard](https://github.com/0xGF/boneyard)'s
`.bones.json` format). After changing the layout of those pages, re-capture
them with the site running:

```shell
npm run build && npm start   # in one terminal
npm run bones                # in another
```

## Links

- [Project Link](https://github.com/brianrahadi/sfucourses)
- Report bugs via [GitHub Issues](https://github.com/brianrahadi/sfucourses/issues)
