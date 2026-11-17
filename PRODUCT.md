# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is visitors exploring the work of RqJey as a developer. They come to understand what has been built, inspect individual projects, and access downloads. An important audience within this group is Minecraft players looking for RqJey's mods and related tools.

## Product Purpose

RqJey's website is a personal developer portfolio and a central home for the developer's projects. It should introduce the developer's work, make projects easy to discover, and provide a clear path to their releases and downloads. Minecraft mods are a key part of the portfolio, but the site also represents utilities, browser-based tools, and other software projects.

Success means a first-time visitor can quickly understand that this is the developer's own portfolio, find work relevant to them, understand what a project does, and reach its current download or source/release page without friction.

## Positioning

A personal portfolio built around real, usable projects: visitors can explore the developer's work and move directly from a project overview to its releases, downloads, or associated tool. It is not only a Minecraft mod catalogue.

## Operating Context

- The site is a static web project hosted from the RqJey GitHub repository.
- Visitors browse project information in the site and follow links to GitHub or project tools.
- Minecraft mod and utility releases are obtained from GitHub Releases; current site configuration identifies the release repository as `Minecraft-Mods`.
- The site currently supports Russian and English on the main page.
- The repository includes a main portfolio/catalog page, Minecraft Tools, Log Analyzer, FAQ, and a CMS area.
- The CMS publishes site content through the repository's GitHub Actions workflow.

## Capabilities and Constraints

- The main page displays projects and utilities with search, category filtering, and sorting.
- Project metadata and editorial content are maintained in `config.js` and `content/site-content.json`.
- Release versions and downloadable assets are retrieved from GitHub Releases; do not invent versions, compatibility, release dates, or download availability.
- Minecraft Tools provides browser-based Minecraft calculators/utilities.
- Log Analyzer is a browser tool for inspecting Minecraft logs.
- FAQ and CMS functionality are part of the existing site and must be preserved during the redesign.
- Shared UI settings and visual preferences are implemented across several pages; preserve their working behavior unless a deliberate replacement is verified.
- The project is an existing static HTML, CSS, and JavaScript codebase. The redesign should work within this stack unless the owner approves a change.
- The redesign must retain responsive behavior, accessibility semantics, existing working navigation, and direct project/release links.
- Do not present unverified claims about downloads, project status, security, performance, compatibility, user counts, or endorsements.

## Brand Commitments

- The portfolio represents the developer under the name RqJey.
- The existing site uses the name “RqJey STUDIO | AURORA” and includes established logo assets. Preserve the recognizable name and assets unless the owner explicitly approves a change.
- The owner has confirmed that the site should prioritize the personal developer-portfolio identity while keeping project discovery and downloads—especially Minecraft mods—central.

## Evidence on Hand

- `index.html`, `style.css`, `app.js`, `config.js`, and `content/site-content.json` define the current main experience and project data.
- `minecraft-tools.html`, `analyzer.html`, and `faq.html` define additional public-facing surfaces.
- `admin/` and `.github/workflows/cms-publish.yml` support the content-management workflow.
- Current project metadata includes Itemly, NearYou, DropGuard, FriendHub, and FastCmd. Treat their descriptions and compatibility as editable project data, not as universal claims.
- The repository contains a logo, favicon, Open Graph assets, and project/news imagery.
- No verified testimonials, customer counts, press coverage, or independent performance benchmarks were identified in the inspected project files. Do not fabricate them.

## Product Principles

1. Lead with the developer and the body of work, not with a generic product landing page.
2. Make each project understandable before asking visitors to download it.
3. Keep releases, versions, and download destinations accurate and easy to reach.
4. Treat Minecraft mods as a prominent portfolio category without hiding non-Minecraft projects and tools.
5. Preserve the working capabilities and content-management flow while making the whole site feel coherent.
