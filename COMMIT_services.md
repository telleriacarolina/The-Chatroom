feat(services): add domain-level services

- Add `services/heartbeat` and `services/backgroundJobs` for presence and session cleanup
- Add `services/documentUpload` (S3 delete helper)
- Add verification cleanup cron job under `src/jobs`
