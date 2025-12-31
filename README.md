# Brain Dump

**Clear your mind. Own your time.**

AI-powered task management that helps you brain dump everything, then automatically categorizes and prioritizes based on your life goals.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in your credentials in .env.local
npm run dev
```

## Setup Guide

### 1. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run migration from `supabase/migrations/001_initial_schema.sql` in SQL Editor
3. Get credentials from Project Settings > API
4. Enable Google OAuth in Authentication > Providers

### 2. Anthropic API

1. Get API key from [console.anthropic.com](https://console.anthropic.com)

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

Update Supabase redirect URLs with your Vercel domain.

## Features

- 🧠 Brain dump everything on your mind
- 🤖 AI categorization & prioritization
- 📅 Google Calendar scheduling  
- 📱 Mobile-first design
- 🎯 Goal-based task ranking
- 📁 Custom life categories with full context

## How It Works

1. Dump all your thoughts/tasks
2. Claude AI processes with context about your:
   - Life categories (description, goals, time allocation, priority)
   - Quarterly and yearly goals
3. Tasks automatically categorized and prioritized
4. View "Next 5" top priorities
5. Schedule or complete tasks

## Tech Stack

Next.js 15, React, TypeScript, Tailwind, Supabase, Anthropic Claude API, Vercel
