# Cole Dorazio — Digital Universe

A single-page personal link hub rendered as an animated orrery. At the center sits the sun; around it orbit three category planets — **Personal**, **Business**, and **Career** — each leading or trailing its own moons (Instagram, LinkedIn, GitHub, Steam, and so on). Selecting a planet zooms into a focused view where its links revolve around it like a mini solar system.

Everything is hand-built vanilla HTML/CSS/JS — no frameworks, no libraries, no build step. The whole site is three files (~70 KB) plus images.

## Features

- **Interactive solar system** — planets drift, sway, and breathe along their orbits; moons form rigid trailing/leading formations around each planet
- **Mobile focus mode** — tapping a planet zooms it to the center of the screen while its moons swirl into a large, thumb-friendly ring around it; the sun dims into an eclipse halo behind
- **3D tilted plane (mobile)** — orbits render as ellipses with real depth: planets grow and brighten as they swing around the front and slip behind the sun's glass at the back
- **Hover-to-freeze (desktop)** — hovering a planet pauses that lane's motion while the rest of the system keeps orbiting
- **Grab-and-spin physics** — drag any ring with true wheel torque (1:1 finger tracking, horizontal or vertical grabs) and momentum flicks
- **All Links window** — categorized list of every destination with live search
- **Communication Methods panel** — personal/business-grouped contact rows, click-to-email and click-to-call, and a downloadable vCard ("Add to contacts")
- **Keyboard support** — arrow keys explore, Enter opens the selection, Esc returns home, `/` opens the All Links search

## Tech Notes

- Zero dependencies and zero external requests beyond the site's own images
- Motion runs on a single `requestAnimationFrame` loop with pure DOM transforms — no canvas, no WebGL
- Responsive from ~320px phones to wide desktops, with `prefers-reduced-motion` support
- Adaptive layout: mobile collapses to one shared orbit ring with evenly spaced, full-size planets; desktop uses three lanes with pinned inner spacing derived from the viewport

## Structure

```
index.html      markup + inline SVG icon sprite (no icon library)
style.css       all styling, animations, and responsive rules
main.js         the orrery: physics, projection, focus mode, search data
images/         logo, profile photo, resume PDF, vCard, favicon assets
```

## Adding a Link

Links live in the `CATS` array at the top of `main.js`. Each entry is a moon with a `name`, `url`, `icon` (from the inline sprite), `handle`, and `desc`. The orbit layout, info panel, All Links list, and search index all derive from that array automatically.

## Running

Open `index.html` directly in a browser, or serve the folder:

```
python -m http.server 8000
```

## License

Personal project — code is viewable for inspiration; content (bio, logo, resume) belongs to Cole Dorazio.
