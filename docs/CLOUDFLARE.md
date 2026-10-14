# Cloudflare Deployment

## Cloudflare Pages

Use:

- Framework preset: **None**
- Build command: `npm run build`
- Output directory: `dist`

The root `_redirects` file sends `/` to `/app/` and rewrites `/app/*` to the SPA shell.

## Workers Static Assets

`wrangler.jsonc` is already included. Once Wrangler is available in your development environment:

```bash
npm run build
npx wrangler deploy
```

The config points Workers Static Assets at `./dist` and enables SPA not-found handling.

## Production persistence

When the backend is added:

1. Create a D1 database such as `mileform-prod`.
2. Create an R2 bucket such as `mileform-activities`.
3. Add the bindings to `wrangler.jsonc`.
4. Move profile, plan and activity-history persistence out of localStorage and behind the Worker API.
5. Keep raw FIT/GPX binaries in R2; parsed summaries can live in D1.

Example future bindings:

```jsonc
{
  "d1_databases": [
    { "binding": "DB", "database_name": "mileform-prod", "database_id": "<id>" }
  ],
  "r2_buckets": [
    { "binding": "ACTIVITIES", "bucket_name": "mileform-activities" }
  ]
}
```

Do not commit secrets. Use Wrangler secrets or Cloudflare environment variables.
