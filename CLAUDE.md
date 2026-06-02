# mcp-x-intelligence — Claude Code Instructions

## After every bug fix or feature
Always create a GitHub release after pushing to main:
- Bump SERVER_VERSION in src/index.ts (patch for fixes, minor for features)
- Use `gh release create vX.X.X --repo fluyeporlaweb/mcp-x-intelligence --title "vX.X.X — description" --notes "changelog"`
- Never leave a version bump without a corresponding release

## Commit conventions
- fix: bug fixes
- feat: new features  
- docs: documentation only
- chore: version bumps, config changes

## Testing before push
Always run `npx tsc --noEmit` before committing
