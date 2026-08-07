# festival-engine-core

Shared certificate/laurel generation engine for the festival-engine family of sites
(bracciano_fest, bif, sicilian, mannheimweb, kiez). Extracted so a fix to the text-fitting
or rendering logic gets written once, instead of copy-pasted by hand across five
repositories — the pattern that turned one bug into a multi-site outage on 2026-08-05.

This package is Next.js/Prisma-agnostic on purpose: it never touches the filesystem,
a database, or Cloudinary. A consuming site resolves its own template bytes, loads its
own font files, and reads its own per-field layout config — then calls into this package
with all of that already assembled. Positions, colors, fonts, and which fields exist at
all stay entirely site-side.

## Distribution — why `dist/` is committed

This package is **not** published to npm. Every consuming site's `package.json` points
at a tagged commit directly:

```json
"festival-engine-core": "github:princi8m/festival-engine-core#v0.1.0"
```

`npm install` on a git dependency *should* run this package's `prepare` script to build
it, but that behavior has open reliability issues in `npm/cli` across some npm versions
and install scenarios. Rather than depend on that working correctly on every consuming
site's build environment (Hostinger, in this family's case), **`dist/` is committed to
this repo and is not gitignored** — the opposite of typical Node package convention.
`prepare: "npm run build"` is kept as harmless defense-in-depth, not as the mechanism
this distribution actually relies on.

### Release process

1. Bump `version` in `package.json`.
2. `npm run build`
3. `git add -A` (this must include `dist/`) and commit.
4. `git tag vX.Y.Z`
5. `git push && git push --tags`
6. Bump the tag in each consuming site's `package.json` when that site is ready to adopt
   it — never move an already-published tag.

## API shape

- `text-fit.ts` — pure text-measurement/wrapping math (`bestTwoLineSplit`, `wrapToFit`,
  `fitAdaptiveText`, `fitOverrideText`), backend-agnostic via an injected `MeasureFn`.
- `pdf.ts` (exported as the `pdf` namespace) — pdf-lib-backed certificate primitives.
  Only `anchor: "center"` fields are implemented; `"top"` throws a clear
  not-implemented error rather than silently mispositioning text.
- `canvas.ts` (exported as the `canvas` namespace) — `@napi-rs/canvas`-backed laurel
  primitives. Only `anchor: "top"` fields are implemented today, for the same reason.
- `types.ts` — `FieldLayout` (position/size), `FieldStyle` (color + fitting thresholds).

Both anchor modes exist in the type system so a future site (e.g. a top-anchored
certificate, matching sicilian/mannheimweb's current behavior) can add support without a
breaking change — but only what the currently-migrated site (bracciano_fest) actually
uses is implemented. Don't build the other mode speculatively; add it when a real site
needs it.
