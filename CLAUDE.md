# CLAUDE.md

Arbiter: AI-judged bounty board on GenLayer, built from genlayerlabs/genlayer-project-boilerplate.

## Commands

```bash
genvm-lint check contracts/arbiter.py
pytest tests/direct/ -v            # in-memory, mocks web + LLM
gltest tests/integration/ -v -s    # needs GenLayer Studio
genlayer deploy                    # runs deploy/deployScript.ts
cd frontend && npm run dev         # Next.js app; `npm run lint` = tsc
```

## Notes

- The contract pins the boilerplate's runner hash (`py-genlayer:1jb45aa8…`). Use that era's API: `gl.Contract`, `gl.nondet.web.render`, `gl.eq_principle.*`. Don't use `gl.vm.run_nondet` (its meaning changed in SDK v0.3) or `emit_transfer` (changed in v0.4).
- Judging uses `gl.eq_principle.prompt_comparative`: the verdict must match and scores may differ by 15 at most. The pass rule is `accepted` and score ≥ 60, checked in deterministic code.
- Raise `gl.vm.UserError(...)`. The frontend translates known revert messages in `components/ui.tsx` (`useErrorText`), so update that map when a message changes.
- Views return plain dicts/lists. genlayer-js decodes them as `Map` and `bigint`; `toPlain()` in `lib/contracts/Arbiter.ts` converts them.
- UI comes only from github.com/longbds0108/Defi: `app/defi.css` is ported from its `src/styles/index.css` + `pages.css`; Arbiter-only pieces live in `app/app.css`. Don't bring in styles, skills or setups from other projects. Every string goes through `t(en, vi)`, with no mixed languages. Don't hardcode demo data.
- npm scripts call `node ./node_modules/...` directly, so they still work when the project path contains `:`.
