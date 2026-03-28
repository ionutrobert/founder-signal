# Founder Signal

**Stop building things nobody wants.**

Founder Signal is a tool that helps you stress-test your startup idea before you invest months (or years) into it. You describe what you're thinking about, and it gives you a structured breakdown of the idea — problem severity, market size, competition, what to build first, how to make money, and what could go wrong.

Think of it as a quick sanity check from a startup analyst who won't sugarcoat things.

## What the report includes

| Section | What it covers |
|---------|---------------|
| **Problem Clarity** | Is this actually a problem people care about? |
| **Target Audience** | Who are you building this for? Can you reach them? |
| **Market Insight** | How big is the opportunity? Is the timing right? |
| **Competition** | Who's already doing this? What's your angle? |
| **Positioning** | How do you stand out? |
| **MVP Scope** | What's the minimum you need to launch? |
| **Monetization** | Revenue model and pricing strategy |
| **Risks** | Technical, market, and operational red flags |

Each report comes with an overall score (0-100) and a verdict: **Pass**, **Needs Work**, or **Fail**.

## How it works

1. Enter your startup idea on the homepage
2. Hit Analyze — the AI evaluates it using a startup validation framework
3. Get your report instantly

No sign-up. No complicated setup. Just paste, analyze, iterate.

## Setup

You'll need Node.js/Bun and an API key for the AI backend.

```bash
git clone https://github.com/ionutrobert/founder-signal.git
cd founder-signal
bun install
cp .env.example .env.local
# Add your API key to .env.local
bun run dev
```

Open `http://localhost:3000` and go.

## Deploying

The app runs anywhere Node.js runs. For Coolify or similar:

```bash
bun run build
bun run start
# Set NVIDIA_NIM_API_KEY in your environment
```

## License

Copyright © 2026 ionutrobert. All rights reserved.

This software is for personal use and learning only. Redistribution and commercial use are not permitted.
