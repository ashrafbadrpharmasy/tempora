# Tempora video safety scanner (prototype)

This separate FastAPI service screens uploaded video files for possible explicit imagery, flagged words in on-screen text, and flagged words in speech transcripts. It fails closed if a model or processing step fails.

## Run locally

Requires Docker and internet access for initial model downloads.

\`\`\`sh
docker build -t tempora-moderator services/moderator
docker run --rm -p 8080:8080 tempora-moderator
curl -F 'file=@sample.mp4' http://localhost:8080/scan
\`\`\`

Health check: \`GET /health\`.

## Before connecting to the public site

- Deploy this container to a separate host that supports FFmpeg, model downloads, multipart uploads, and longer CPU jobs.
- Add authentication, rate limits, HTTPS, and a retention/deletion policy before public exposure.
- The prototype accepts uploads, not arbitrary web-page URLs. It does not scrape protected streaming services.
- Flagged videos are blocked; other videos still require human review. Do not auto-approve from an automated “clean” result.
- Sampling can miss brief scenes. OCR and speech recognition can miss languages, slang, music, overlapping speech, or captions. This does not verify age and cannot guarantee “100% clean”.
- The included term list is English-only and must be adapted to the site's languages and policy.
- Open-source code can avoid per-call API fees, but hosting, CPU/RAM, bandwidth, and storage may cost money. No free host guarantees unlimited video processing.
