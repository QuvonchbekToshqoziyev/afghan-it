# Afghan IT Academy Public Frontend Design

## Goal

Replace the generic LMS SaaS presentation with a cohesive Afghan IT Academy education brand across the public-facing frontend, while preserving the existing LMS behavior, authentication, tenant isolation, course enrollment, and admin/dashboard surfaces.

## Scope

The redesign covers:

- The default platform homepage at `/[locale]`.
- The default tenant fallback homepage at `/[locale]` when served through `lvh.me`.
- The shared public navbar, footer, and public shell.
- Public courses, products, pricing, creators, and about pages.
- Auth pages that render inside the shared public shell.
- Responsive desktop, tablet, and mobile layouts.

Puck-authored tenant pages remain functional and keep their own authored content, but the shared brand primitives should remain compatible with them. Authenticated dashboards and platform/admin workflows are not redesigned in this pass.

## Visual direction

The reference establishes a polished, education-focused academy identity:

- Deep navy and midnight-blue backgrounds with restrained indigo/purple accents.
- White and cool-gray content surfaces for course discovery sections.
- Uzbek-first labels and marketing copy, with English/Pashto language switching retained.
- A compact academy wordmark treatment using the existing brand mark where available.
- Strong left-aligned hero hierarchy, student/laptop imagery when a local asset exists, and decorative technology marks using existing iconography.
- Course cards grouped into “IT yo‘nalishlari” and “Ingliz tili kurslari”.
- Trust strip, numeric proof, CTA panel, newsletter area, and multi-column footer.

Avoid generic SaaS gradients, excessive glass effects, large rounded containers everywhere, and unverified claims. Any metric or course shown without database data must be clearly treated as a presentation fallback rather than operational data.

## Component structure

Create or adapt focused public components rather than putting the full redesign into one route file:

- `AcademyHeader`: responsive navigation, search/language actions, login and registration CTAs.
- `AcademyHero`: headline, supporting copy, CTAs, progress/social-proof treatment, and optional local hero asset.
- `AcademyFeatureStrip`: five compact value propositions.
- `AcademyCourseSection`: category heading, “all courses” link, and responsive course cards.
- `AcademyCourseCard`: image/icon, title, category, learner count, level, and course link.
- `AcademyStatsAndCta`: academy invitation plus proof metrics.
- `AcademyFooter`: brand, platform/support/company links, newsletter affordance, social links, and legal line.

The homepage composes these components from existing Supabase-loaded course/product data where possible. Existing `Navbar`, `Footer`, and `SchoolLandingPage` APIs may be adapted or wrapped so other public routes do not lose tenant-aware behavior.

## Data and behavior

- Preserve existing route generation, locale handling, tenant detection, Puck page branching, and Supabase queries.
- Course cards link to the current public course/product routes.
- Login, registration, course browsing, language switching, and tenant-specific links remain real working links.
- Missing images use deterministic local icon/color fallbacks; no remote image dependency is required for the core layout.
- The default platform page uses Afghan IT Academy copy and presentation data. Tenant pages use tenant identity and live tenant products while inheriting the visual system.

## Responsive and accessibility requirements

- Desktop composition matches the supplied reference at wide widths.
- Mobile navigation becomes a usable compact menu; critical CTAs remain visible.
- Course sections collapse to one or two columns without horizontal overflow.
- All images have meaningful alternative text or are explicitly decorative.
- Color contrast, keyboard focus, semantic headings, and reduced-motion behavior remain valid.

## Verification

- Run typecheck and lint for changed files.
- Verify `/en`, `/es`, tenant home, public courses, pricing, about, login, and signup locally.
- Verify seeded course data renders and links remain functional.
- Capture desktop and mobile screenshots from localhost for visual comparison.
- Confirm `git status` contains only intentional implementation changes.
