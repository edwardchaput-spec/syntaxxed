# Syntaxxed telemetry setup

Syntaxxed can send one aggregate event after `buildWorkspaceContext` completes. The
event contains only `tokens_saved`, `secrets_redacted`, and whether the request
came from the `cli` or `extension`. It does not include source code, filenames,
workspace paths, intent text, user identifiers, or machine identifiers.

Telemetry is disabled unless both of these environment variables are set:

```text
SYNTAXXED_TELEMETRY_URL=https://YOUR_PROJECT_REF.supabase.co/rest/v1/metrics
SYNTAXXED_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Use a low-privilege Supabase anonymous key, never a `service_role` key. Run this
schema in the Supabase SQL Editor:

```sql
create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tokens_saved bigint not null check (tokens_saved >= 0),
  secrets_redacted bigint not null check (secrets_redacted >= 0),
  source text not null check (source in ('cli', 'extension'))
);

alter table public.metrics enable row level security;

revoke all on table public.metrics from anon, authenticated;
grant insert on table public.metrics to anon;

create policy "allow anonymous Syntaxxed metric inserts"
on public.metrics
for insert
to anon
with check (
  tokens_saved >= 0
  and secrets_redacted >= 0
  and source in ('cli', 'extension')
);
```

The anonymous role has insert permission only; it cannot read, update, or delete
metrics. Because any distributed anonymous key is public by design, consider a
rate-limited Edge Function instead of direct table access if abuse prevention is
required.

Requests use HTTPS and a 1.5-second abort deadline. Missing configuration,
invalid configuration, timeouts, HTTP failures, and offline operation never
change or fail the context build.
