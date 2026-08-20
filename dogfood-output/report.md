# MVP Dogfood QA Report

**Target:** https://afghan-it.vercel.app/
**Date:** 2026-08-20
**Scope:** Public learner journey, catalog, authentication/session behavior, localization, navigation, and production API health
**Method:** Live HTTPS/API probes plus source-level journey tracing. Browser click automation was unavailable, so visual/mobile and console checks remain untested.

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 3 |
| Medium | 6 |
| Low | 1 |
| **Total** | **10** |

**Overall assessment:** The public shell and catalog API are online, but account access, catalog discovery, and session continuity still have MVP-blocking defects.

**Resolution:** All 10 findings were fixed on 2026-08-20 and covered by targeted regression checks before production deployment.

## Issues

### 1. Signed-in account page calls a nonexistent API endpoint

- **Severity:** High
- **Category:** Functional
- **URL:** https://afghan-it.vercel.app/account
- **Evidence:** `/api/v1/me` returns `404`; the implemented route is `/api/v1/auth/me` and returns the expected unauthenticated `401` without a token.
- **Reproduce:** Sign in, open **My account**, and observe that account details fail to load.
- **Expected:** The profile loads from the authenticated `auth/me` endpoint.
- **Actual:** The page requests `/api/v1/me`, which does not exist.

### 2. Half of the featured homepage course cards lead to zero results

- **Severity:** High
- **Category:** Functional
- **URL:** https://afghan-it.vercel.app/
- **Evidence:** Matching the exact frontend filter against the live catalog gives zero matches for `React JS`, `Flutter`, `AI Basics`, `English Speaking`, `Listening Skills`, and `Writing Skills`—6 of 12 cards.
- **Reproduce:** Click any affected featured card.
- **Expected:** At least one relevant course appears.
- **Actual:** The courses screen resolves the card label as a literal search query and displays an empty result.

### 3. Authentication becomes stale after the 15-minute access-token expiry

- **Severity:** High
- **Category:** Functional / UX
- **URL:** All authenticated pages
- **Evidence:** The API issues a 15-minute access token and a 30-day refresh cookie, but the web app never calls `/api/v1/auth/refresh` or retries a `401`. The header only checks whether the expired token string still exists in `sessionStorage`.
- **Reproduce:** Sign in, wait until the access token expires, then open Dashboard or AI Mentor.
- **Expected:** The refresh cookie renews the session, or the user is cleanly redirected to sign in.
- **Actual:** The UI can still show **My account** while protected requests fail.

### 4. Header search control does nothing

- **Severity:** Medium
- **Category:** Functional
- **URL:** Pages using the shared header
- **Evidence:** The search button has no link, click handler, or search UI.
- **Expected:** Open or focus course search.
- **Actual:** Clicking it has no effect.

### 5. Course-detail Sign in link points to a nonexistent homepage anchor

- **Severity:** Medium
- **Category:** Functional
- **URL:** `/courses/:id`
- **Evidence:** The link target is `/#login`; the homepage has no `id="login"`. The actual sign-in route is `/login`.
- **Expected:** Navigate to the login screen.
- **Actual:** Navigate to the homepage without exposing sign in.

### 6. Footer support links and newsletter are inert

- **Severity:** Medium
- **Category:** Functional / UX
- **URL:** https://afghan-it.vercel.app/#footer
- **Evidence:** Help, Contact, Privacy, and Terms all link back to `#footer`. The email field and arrow button have no form or submit handler.
- **Expected:** Open the named information or submit a subscription.
- **Actual:** The controls provide no meaningful action or feedback.

### 7. Three-language behavior stops at course detail, teacher, and admin pages

- **Severity:** Medium
- **Category:** Functional / Content
- **URL:** `/courses/:id`, `/teacher`, `/admin`
- **Evidence:** These pages do not use the shared language state or selector. Course-detail UI remains English after selecting Dari or Pashto.
- **Expected:** The selected language persists across the full journey.
- **Actual:** Navigation into these pages silently returns the interface to English.

### 8. Uzbek content still exists in live course data

- **Severity:** Medium
- **Category:** Content
- **URL:** Frontend Development course and catalog cards
- **Evidence:** The live API description is `React va zamonaviy web dasturlashni noldan o‘rganing.` despite the UI supporting only English, Dari, and Pashto.
- **Expected:** Course content follows one of the three supported locales.
- **Actual:** Uzbek database content is shown unchanged in every selected language.

### 9. Failed or missing course requests show an endless loading message

- **Severity:** Medium
- **Category:** UX
- **URL:** `/courses/:id`
- **Evidence:** Failed fetches set `course` to `null`, while the `null` render path always says `Loading programme…`; there is no loading/error distinction.
- **Expected:** A clear not-found or retry state.
- **Actual:** The page looks permanently busy.

### 10. PWA manifest advertises installation without any icons

- **Severity:** Low
- **Category:** Content / UX
- **URL:** https://afghan-it.vercel.app/manifest.webmanifest
- **Evidence:** The live manifest returns `"icons": []`.
- **Expected:** Installable app icons for supported device sizes.
- **Actual:** Installed shortcuts may use a generic icon or fail installability criteria in some clients.

## Issues Summary

| # | Title | Severity | Category |
|---|-------|----------|----------|
| 1 | Account endpoint is wrong | High | Functional |
| 2 | Six featured cards return no results | High | Functional |
| 3 | Session expires without refresh handling | High | Functional / UX |
| 4 | Search button is inert | Medium | Functional |
| 5 | Course sign-in link is broken | Medium | Functional |
| 6 | Footer controls are inert | Medium | Functional / UX |
| 7 | Localization stops on key pages | Medium | Functional / Content |
| 8 | Uzbek remains in course data | Medium | Content |
| 9 | Course errors look like endless loading | Medium | UX |
| 10 | PWA manifest has no icons | Low | Content / UX |

## Testing Coverage

- **Pages probed:** home, courses, login, mentor, dashboard, account, teacher, admin, 404, manifest, service worker.
- **APIs probed:** courses, account/profile, dashboard, teacher, admin.
- **Confirmed healthy:** public pages return `200`, unknown route returns `404`, catalog API returns `200` with 12 courses, protected dashboard/teacher/admin APIs return `401` without a bearer token.
- **Not tested:** visual responsive behavior, browser console, keyboard interaction, successful registration/login/enrollment/assessment, payments, certificates, and role-authorized teacher/admin flows.
- **Blocker:** browser-control tooling was unavailable, so no screenshots were captured.
