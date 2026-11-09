# Amar Shopping — Release Gates

These gates apply to every future feature, fix, refactor, dependency update, database change, and production deployment.

## 1. Change request and owner approval

Before editing, provide the owner with:
- the exact requested behavior and acceptance criteria;
- files, functions, services, tables, policies, RPCs and integrations likely to change;
- existing features that could be affected;
- backup and rollback plan;
- tests that will be run.

Wait for explicit approval for that specific change. Approval of one change does not authorize unrelated cleanup, redesign, refactoring, dependency upgrades, data migrations, or deployment changes.

## 2. Isolation

- Create a feature branch from the latest known-good `main`.
- Never experiment directly on production `main`.
- Keep the patch as small and additive as possible.
- Do not combine feature work with unrelated fixes or formatting.
- Do not change Supabase schema/data/RLS/Auth/RPC/Storage or payment behavior without explicit, specific approval.

## 3. Automated checks

Required before merge:
- storefront inline JavaScript syntax check;
- protected source-anchor regression check;
- relevant unit/integration tests for the changed feature;
- build/package checks for the affected target;
- security and dependency review for dependency changes.

A passing static check is not a substitute for browser and backend tests.

## 4. Staging and end-to-end checks

Deploy the candidate to a separate staging environment, not the live service. Verify, as applicable:
- storefront loads with no console errors;
- menu, navigation and language selector;
- product search, category filters and product details;
- cart, stock validation, checkout and order placement;
- customer signup/login, profile, order history and tracking;
- seller application and seller product submission;
- private admin reveal, password login and email OTP;
- admin dashboard and every existing management section;
- order status changes, customer-visible status history, realtime updates and polling;
- payment selection and any payment-related flow;
- mobile layout and Android build when affected.

Use safe test accounts and test data. Never use real customer data for destructive tests.

## 5. Production release

- Confirm all required checks passed and staging checks were completed.
- Present the final diff and test report to the owner.
- Obtain a separate explicit approval to merge/deploy to production.
- Deploy without clearing production data or caches unless separately approved and justified.
- Verify deployment status and smoke-test the live site.

## 6. Failure and rollback

If a required check fails, staging behavior regresses, or verification is incomplete:
- do not merge or deploy;
- report the exact failure and affected scope;
- fix on the feature branch and rerun all relevant checks;
- if a live release has already failed, roll back to the last known-good release and verify recovery.

## 7. Honest status labels

Use only:
- **PASS** — test actually executed and passed;
- **FAIL** — test executed and failed;
- **NOT RUN** — not executed;
- **NOT VERIFIED** — evidence is insufficient.

Never describe a feature as fully working based only on source-code presence or successful deployment.
