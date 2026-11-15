# Changelog

## Unreleased

- `colorModeScript()` can be called from a server component (a root layout). It is exported from the main entry and from `@extantape/payload-plugin-color-theory/mode/script`, neither of which is a client module. The published 0.1.0 only had it in `/mode`, a `'use client'` module, so a server layout failed with "Attempted to call colorModeScript() from the server". The `/mode` entry still re-exports it for client code.
- A test now builds the package and checks the built `colorModeScript` modules have no `'use client'` line and give the same script as the source, for the defaults and a custom `storageKey` and `attribute`.
- Tested: the full suite, typecheck and leak check pass; the built output of the main entry and `mode/script` has no `'use client'`; the script text is the same from source and build.
- Not tested: a real Next.js server layout importing the built package (the failure was seen on a live site, not reproduced here); a release has not been cut.
