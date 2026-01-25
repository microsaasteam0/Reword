# Business Intent: Reword

## Product Overview
- **Product Type**: SaaS / AI Content Repurposing Tool
- **Primary Function**: Automating the transformation of long-form content (blogs, articles, newsletters) into platform-optimized social media posts (X/Twitter, LinkedIn, Instagram).
- **Target Audience**: Content creators, marketers, and businesses looking to maximize content reach with minimal manual effort.
- **Monetization Model**: Freemium subscription model (Free vs. Pro tiers) integrated with Dodo Payments.
- **Deployment Type**: Modern Web Application (Next.js frontend, FastAPI backend).

## Core Capabilities
- **AI Content Repurposing**: Multi-platform post generation (Twitter threads, LinkedIn posts, Instagram carousels) from a single source of text.
- **Usage Management**: Tiered quota system (e.g., 2 daily generations for Free users) with real-time usage tracking and persistent caching.
- **Subscription Management**: Automated billing cycles (monthly/yearly), payment history tracking, and dynamic "Feature Gating" based on premium status.
- **Support System**: Integrated customer support widget with Brevo-powered automated email notification and user identification.
- **Community & Education**: Content-driven engagement through a dedicated blog and community templates.

## Surface Classification

### Public Pages (Indexable Candidates)
| Route | Purpose | Confidence |
|------|--------|-----------|
| `/` | Landing page, primary value proposition, and guest tool access. | High |
| `/features` | Detailed breakdown of AI capabilities and platform optimizations. | High |
| `/pricing` | Subscription plans, comparison of Free vs. Pro tiers. | High |
| `/blog` | Content marketing, SEO-driven articles, and guides. | High |
| `/about` | Company mission, team, and brand story. | High |
| `/updates` | Product changelog and upcoming features. | High |
| `/community` | Hub for user templates and public creator interactions. | Medium |

### Private / App Pages (Never Index)
| Route Pattern | Reason | Confidence |
|--------------|--------|-----------|
| `/auth/*` | Post-callback handling and sensitive token management. | High |
| `/verify-email` | Transactional verification process with temporary tokens. | High |
| `/api/*` | Backend logic, data endpoints, and sensitive business operations. | High |
| Dashboard State | Authenticated user workspace for content generation and history. | High |

## User Journey
- **Entry Point**: Direct traffic to the landing page or organic discovery via the blog/features pages.
- **Core Interaction**: Providing source text (URL or copy-paste) and generating social-ready snippets using the AI "Repurpose" engine.
- **Conversion Action**: Triggered by usage limit exhaustion (2/2 daily limit) or desire for premium "Pro" features (unlimited generations, advanced templates).
- **Post-Conversion State**: Sustained usage with automated billing, unrestricted generation access, and premium badge navigation.

## Content Signals
- **Blog Detected**: Yes (Next.js directory `/blog` and associated data structures).
- **FAQ Detected**: Low Confidence (Likely embedded within `/features` or `/about` pages).
- **Guides / Docs**: No (Observable focus is on UI-driven simplicity rather than technical documentation).
- **Trust Pages Detected**: Privacy Policy, Terms of Service, and Cookie Policy (Detected in footer UI and footer component).

## SEO-Safe Assumptions
- **What this product IS**: A productivity tool that leverages Large Language Models to reformat and optimize existing text for specific social media platform constraints.
- **What this product IS NOT**: A general-purpose AI chatbot (ChatGPT), a direct social media scheduler (Hootsuite/Buffer), or a content discovery/curation engine.

## Confidence Summary
- **Overall Confidence Score (0–1)**: 0.95
- **High Confidence Areas**: Auth logic, generation quota systems, payment integration flow, and core navigation structure.
- **Low Confidence Areas**: Depth of "Community" features and backend data persistence for template sharing.

## SEO Execution Constraints
- **Routes that must never be indexed**: Any route containing `token=`, `/api/`, or authenticated `/auth/callback` paths.
- **Routes safe for canonicalization**: Marketing static pages (`/pricing`, `/features`) to the primary marketing domain.
- **Areas requiring conservative SEO**: The `/community` section, as user-generated content risk requires moderation before heavy indexing.
