# Week 8 close-out — RESOLV-HQ

**Prepared:** 21 Oct 2026 | **Brief deliverables:** tagged release + README, final report, evidence pack, deck + demo, ClickUp and repo evidence.

## Status against the Week 8 checklist

| Deliverable | Status | Evidence / what remains |
|---|---|---|
| Repository/evidence trail fixed | ✅ Done (documented option) | The wrapper is not a Git repo. The three-repo layout, remotes and clone commands are in the workspace [`README.md`](../../README.md). No gitlinks or `.gitmodules` exist. |
| Tagged, reproducible release in each repo | ⏳ **You must do this** | Working trees are not clean (below). Commands further down. |
| Critical defects fixed / limitations documented | ⚠️ Partial | Limitations documented (report §10, [`failure-catalogue.md`](./failure-catalogue.md)). **F4 and F6 are not fixed**; not done here because F4 is an admin action on production data. |
| Final engineering report | ✅ Draft assembled | [`final-engineering-report.md`](./final-engineering-report.md). Resolve each **[LEAD TO CONFIRM]**, then export (≈ 10–12 pages once exported with diagrams). |
| Evaluation/evidence pack | ⚠️ Index built, content incomplete | [`../evidence/README.md`](../evidence/README.md). Screenshots folder is empty. 25 of 34 scenarios still have no recorded result. |
| Deck + rehearsed live demo | ⚠️ Script ready | [`../evidence/demo/demo-script.md`](../evidence/demo/demo-script.md). Deck not built; rehearsal not done. |
| ClickUp board closed out | ⏳ **You must do this** | Not accessible from the repository. |

## Verified on 21 Oct 2026

- `resolv-hq-backend`: `npm test` 41/41 pass; `tsc --noEmit` clean.
- `resolv-hq`: `npm test` 17/17 pass; `tsc --noEmit` clean.
- Not run: lint, `resolv-hq-customer` tests/build, Docker builds, a clean-checkout install.

## Before tagging

| Repo | State found on 21 Oct |
|---|---|
| `resolv-hq` | Last commit `fa5bef1` (merge of PR #59, sub-agents). Docs and evidence added today are uncommitted. |
| `resolv-hq-backend` | Last commit `221d47c`. **Staged but uncommitted:** changes to `agent-tool-context.ts`, `agent-tools.ts`, `ai.ts`, `sub-agents.ts`, and new `tests/get-my-tickets.test.ts`. |
| `resolv-hq-customer` | Last commit `03703c1`. **Uncommitted:** `.env.example`, `package.json`, `package-lock.json`, and untracked `Dockerfile`, `.dockerignore`. |

Commit or discard those first. Also check the customer repo for committed PDFs/`.env.local`, and the console repo for `.env` and `.env.local` (all should stay out of Git).

```bash
# in each repo, after committing and pushing main
git tag -a v1.0.0 -m "RESOLV-HQ final release (capstone week 8)"
git push origin v1.0.0
```

Then, from a clean folder, follow the workspace README to prove the clone-and-run path, and note the date here.

## Carried over / not done, with reason

| Item | Reason | Owner |
|---|---|---|
| Run 25 unrun evaluation scenarios | Needs live model and logins; provider free tier limits ≈ 4 requests/min | QSL |
| F4 unpublish and re-run D7 | Production data action for the project owner | PRL |
| F6 identical-repeat rule, live cap-exhaustion trace | Code change plus live run | DDL / AIL |
| Fly deploy + Vercel link | Needs credentials; first deploy failed, redeploy unconfirmed | DDL |
| Refresh `tool-catalogue.md` and `agent-task-contract.md` for `get_my_tickets` | Docs say four tools; code has five | AIL |
| Refresh `resolv-hq/README.md` | Still describes the Week 2 UI-only state ("No backend exists yet") | PRL |
| Charter, user stories, Week 1 report | Confirm they exist and link them (report §2, Appendix A) | PRL |
| Week 7/8 progress report links and contributions table | Commit/tag/ClickUp links need the lead | PRL |
| Screenshots, rehearsal recording, deck | Needs the running system | PRL + AIL |

## ClickUp close-out checklist

- [ ] Every Week 1–8 task is either Complete or carries a reason from the table above.
- [ ] Each completed task links its commit or evidence file.
- [ ] Board link added to the final report and the Week 8 progress report.
