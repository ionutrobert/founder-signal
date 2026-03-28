# Founder Signal

**Validate your startup idea before you build.**

Founder Signal helps founders avoid months of wasted effort by evaluating startup ideas through a structured, analyst-grade framework. Submit your idea and receive a comprehensive validation report in seconds.

## Why Use Founder Signal?

- **Save months of work**: Discover fatal flaws before you write a single line of code
- **Investor-ready insights**: Get the same evaluation framework VCs use internally
- **Actionable feedback**: Not just a score — understand exactly what needs work
- **No bias**: Objective analysis based on market data, not gut feelings

## What You Get

Every validation report includes:

| Section | What It Tells You |
|---------|-------------------|
| **Idea Summary** | Crystal-clear articulation of your concept |
| **Problem Clarity** | Is this a real problem people will pay to solve? |
| **Target Audience** | Who exactly is your customer? Are they reachable? |
| **Market Insight** | Is the market big enough? Growing? Timing right? |
| **Competition** | Who else is solving this? Can you differentiate? |
| **Positioning** | How should you frame your value proposition? |
| **MVP Scope** | What should you build first? What can wait? |
| **Monetization** | How will you make money? Is it sustainable? |
| **Risks** | What could kill this? Technical, market, operational, regulatory |

## Scoring System

Every idea receives a **0-100 score** with a clear verdict:

- **Pass (80+)**: Strong foundation, minimal risk — proceed with confidence
- **Needs Work (60-79)**: Promise but gaps — refine before building
- **Fail (<60)**: Fundamental issues — reconsider or pivot

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- An API key for the AI service (obtain from the provider's website)

### Quick Start

1. **Clone and install:**
   ```bash
   git clone https://github.com/ionutrobert/founder-signal.git
   cd founder-signal
   bun install
   ```

2. **Configure your API key:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API key.

3. **Run:**
   ```bash
   bun run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000) and submit your idea.

## How It Works

1. **Input your idea** — Describe your startup concept in your own words
2. **AI analyzes** — Our framework applies startup analyst methodology to evaluate every dimension
3. **Get your report** — Structured breakdown with actionable recommendations

## Deployment

Designed for self-hosted deployment. Works with Docker, Coolify, or any Node.js hosting:

1. Build: `bun run build`
2. Start: `bun run start`
3. Set the API key environment variable in your hosting platform

## License

**All Rights Reserved**

Copyright © 2025 ionutrobert

This software and associated documentation files are the exclusive property of the author. 

**You may NOT:**
- Use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software
- Permit others to do any of the above

**You MAY:**
- View and study the code for educational purposes only
- Fork for personal, non-commercial learning

Any unauthorized use will be prosecuted to the fullest extent of the law.

For licensing inquiries, contact the author.
