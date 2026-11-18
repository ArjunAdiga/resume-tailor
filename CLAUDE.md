# CLAUDE.md

Project: resume-tailor, a Next.js App Router + TypeScript app that tailors my LaTeX (Overleaf) resume to a job description. Two modes: personal (my laptop, Ollama qwen3:4b, saved resume, history, PDF) and demo (public on Vercel, Gemini, no storage, rate limits).

## Rules

- TypeScript strict, small pure functions, Vitest tests for everything in src/lib.
- The LLM only rewrites text inside `\resumeItem{...}` bullets. Code does all parsing and rebuilding.
- Never invent experience, skills, tools, numbers or employers. Only rephrase or reorder what exists.
- Escape LaTeX special characters in all model output before inserting it.
- No secrets in git. My real resume lives in private/ (gitignored). Files in samples/ use fake data.
- Local-only features (saved resume, history, PDF) return 404 in demo mode.
- Ask before adding dependencies beyond zod, vitest and diff.

## Working rules

- Do one task at a time.
- Write one file per tool call.
- Keep each file under 150 lines.
- Never paste whole files into your replies.
- When finished, reply in at most 3 lines and stop.
