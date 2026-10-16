# improve-product — take a product to the next level

Plan v2, or take a working v1 to production-grade. The output is a prioritized
opportunity list, not code — building happens after, through normal tickets.

**Seam with code/architecture review:** a codebase review looks inward
(module depth, seams, testability). This skill looks outward (what a user,
judge, or operator experiences: demo story, reliability, deployability,
docs, cost). Run either alone; run both when v2 needs inside and outside work.
Neither duplicates the other.

## Process

### 1. Discover

Build the product picture from what exists — README/docs, the live demo if it
runs, open tickets/ANCHOR state, submission or launch criteria if any. Do not
demand a context file or ADRs; most app repos don't have them. If a prior
codebase-architecture report exists, read its Top recommendation so internal
and external plans don't diverge.

Walk the product the way an outsider would: install it, click the demo path,
break it, read the docs as a stranger. Note every place where the experience
sags. Consult the audit dimensions below; every dimension gets a verdict
(strong / needs work / out of scope), none skipped silently.

Completion criterion: each dimension has a one-line verdict with file or
observed-behavior evidence.

### 2. Research the outside world

For each problem area from step 1, gather prior art before proposing fixes.
Do all of it in the browser, like a senior dev — never from memory:

- **Existing apps** — find 2–3 products that solved (or attempted) the same
  problem. For each: what they built, what worked, what they abandoned, and
  the URL where you read it.
- **Papers & articles** — one relevant paper, benchmark, or engineering
  deep-dive per hard problem (retrieval quality, evaluation, knowledge
  freshness — whatever the area is). Skim for method + numbers, not vibes.
- **Who tried this** — name teams/posts that attempted it and what they
  concluded. Failures count double: they veto bad fixes.
- **Record as you go** — every claim that survives into a card carries its
  source URL. A card with no sources is a guess; label it `unverified`
  instead of dressing it up.

Completion criterion: every shortlisted problem area has ≥2 outside sources
with URLs, or is explicitly marked `unverified`.

### 3. Present opportunities as an HTML report

Write a self-contained HTML file to the OS temp directory (`$TMPDIR`,
fallback `/tmp`, `%TEMP%` on Windows) at
`<tmpdir>/product-review-<timestamp>.html`. Open it (`open` macOS,
`xdg-open` Linux, `start` Windows) and tell the user the absolute path.
Tailwind via CDN for layout, Mermaid via CDN for flows where structure is
graph-shaped (user journeys, deploy topology, before/after).

Each opportunity is a card with:

- **Area** — which dimension and which files/demo steps are involved
- **Problem** — the sag, stated as a user-visible failure ("a judge on a Mac
  cannot finish setup because…"), with evidence
- **Fix** — plain-English change, sized (small / medium / epic)
- **Prior art** — the 1–3 best outside sources (app, paper, or post) with
  URLs, and what each one teaches this fix
- **Payoff** — who feels it and when (demo day, onboarding, ops, cost),
  plus an **impact × effort** badge (`quick win`, `worth it`, `big bet`)
- **Before / After** — the journey or topology as-is vs. fixed

End with a **Top recommendation**: the smallest set of cards that makes the
product demonstrably production-grade, and why that set, in that order.

Completion criterion: every card carries evidence and a badge; the Top
recommendation names concrete cards, not themes.

### 4. Prioritize, then ticketize

Ask the user: "Which of these go into v2?" Grill each pick lightly —
constraint, dependency, what "done" looks like — then convert picks to
tickets (title, scope, verification command, owner). Park the rest explicitly
as non-goals so a future run doesn't re-suggest them silently.

Completion criterion: every picked card has a ticket; every unpicked card is
listed under non-goals.

## Audit dimensions (reference — verdict each, skip none)

1. **Demo story** — can a stranger run the golden path in under 5 minutes?
2. **Setup & docs** — install works on a fresh machine (all major OSes); README commands run copy-paste.
3. **Reliability** — failure modes surface as messages, not stack traces; no dead buttons on empty states.
4. **Performance** — the demo path feels instant; numbers claimed are reproducible.
5. **Deployability** — one documented path to a public URL; secrets never in git; free-tier feasible.
6. **Operability** — logs, health checks, and a way to reset/re-seed state.
7. **Compliance** — licenses, AI-usage disclosure, submission rules, data provenance.
8. **Cost** — every paid dependency named with its free alternative and the switch-over cost.

## Rules

- This skill changes no product code. Findings become tickets; tickets become work.
- No forward references: anything deferred lands under non-goals with a reason.
- Never propose an opportunity you couldn't verify — run the command, click the path, cite the output.
- Browser research is mandatory, not optional: no fix is proposed on memory
  alone. When sources conflict with the codebase, say so with both citations.
