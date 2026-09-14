# yanivakiva.com

Floating-garden portfolio built with React, Vite, and a scroll-driven image sequence. The garden leads into a dark, terminal-inspired experience section. Motion can be disabled and follows the system reduced-motion preference.

## Development

Run `npm ci`, then `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`.

Use http://127.0.0.1:5173/ for the local preview. Run `npm test` and `npm run build` to validate. Static output is generated in `dist/`.

## GitHub Pages

Pushes to `floating-garden` run `.github/workflows/deploy.yml`: install locked dependencies, test, build, and publish only `dist/` to GitHub Pages. The Pages publishing source is GitHub Actions; `public/CNAME` preserves `yanivakiva.com` and its existing HTTPS configuration. The old `master` branch is retained unchanged as a rollback reference.

Production artwork is checked in under `public/garden/`; it requires no paid services, generation tools, or local intermediate files to build.

## Public content and branding

- `src/garden/portfolio-data.js` contains the public experience and contact details.
- Use only `contact@yanivakiva.com`. Never add the private CV PDF, phone number, or personal email to this repository or its build.
- `public/og.png` is the garden-and-fox sharing card. Its metadata is in `index.html`, available without JavaScript.
- Favicons and home-screen icons use the approved YA/ mark.
- To reproduce brand exports on macOS: `swift scripts/build-brand-assets.swift public/fonts/SpaceGrotesk-Medium.ttf`. Both font weights and their OFL license are included.
- Design previews, recordings, and production intermediates stay local; they are not needed for deployment.
