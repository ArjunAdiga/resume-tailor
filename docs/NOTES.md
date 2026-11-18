# NOTES.md

- Resume source order: uploaded or pasted text, then private/base.tex (personal mode only), then samples/resume.sample.tex. The UI always shows which source is in use.
- Ollama structured output: send a JSON schema in the "format" field of /api/chat, set stream:false, validate with Zod, retry once on failure.
- Qwen3 thinking mode: send "think": false in the /api/chat request (needs a recent Ollama). Fallback: add /no_think to the prompt. Thinking is slow and unnecessary for short rewrites.
- Small-model settings: temperature 0 to 0.2, num_ctx 8192 (the default context can silently truncate resume plus JD), one bullet per call.
- Anti-invention guard (guards.ts): reject a rewritten bullet if it adds a number or percentage not in the original, adds a tech term not in the full resume text, changes length by more than 15 percent, contains LaTeX commands or newlines, is empty, or is identical to the original. On rejection retry once with the reasons, then keep the original.
- Code decides which keywords are present or missing and computes the score. The model only extracts JD requirements and rewrites bullets.
- Vercel cannot reach localhost Ollama, because on Vercel "localhost" is Vercel's own server. Demo mode uses Gemini.
- Demo privacy: never store or log resume or JD text; show a notice that text is sent to the Gemini API.
