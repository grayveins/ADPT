# push-on-message

Supabase Edge Function that fires an Expo Push notification when a new
`messages` row is inserted.

## Setup (one-time, ~3 minutes)

The Supabase CLI is a devDependency in this repo, so use `npx supabase`
(not bare `supabase`).

### 1. Auth + link

```bash
cd ~/troyg/Projects/ADPT
npx supabase login                                      # browser flow, once per machine
npx supabase link --project-ref yckodvjabgkemhddrzle    # once per repo clone
```

### 2. Deploy the function

```bash
npx supabase functions deploy push-on-message
```

You should see the function appear in
`https://supabase.com/dashboard/project/yckodvjabgkemhddrzle/functions`.

### 3. Add the service-role key to Vault

The trigger reads the service-role key from **Supabase Vault** (hosted
Supabase doesn't let `postgres` set arbitrary database-level GUCs, so
the `ALTER DATABASE … SET` pattern fails with `permission denied`).

In **Studio → Project Settings → Vault → Add new secret**:

| Field | Value |
|---|---|
| Name | `service_role_key` |
| Value | _paste from Project Settings → API → service_role_ |

> Use the **service_role** key (the long one), not the anon key. Treat
> it like a password.

### 4. Apply the trigger migration

```bash
npx supabase db push
```

This applies any pending migrations including
`20260502_messages_push_trigger.sql`, which creates an
`AFTER INSERT FOR EACH ROW` trigger on `messages` that calls the Edge
Function via `net.http_post`.

### 5. (Optional) Expo Access Token

Only required if the project has Expo Enhanced Security enabled. Set it
in **Studio → Edge Functions → push-on-message → Secrets**:

```
EXPO_ACCESS_TOKEN=<token from expo.dev/accounts/.../settings/access-tokens>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected into the
function's runtime env — you don't set those.

## Verify

1. Sign in on a real device as a client. Confirm you accepted the push
   permission prompt at first launch.
2. Confirm the token registered:
   ```sql
   SELECT id, push_token FROM profiles WHERE push_token IS NOT NULL;
   ```
3. Background the app fully (swipe up).
4. From the dashboard, send the client a message.
5. The mobile device should receive an OS notification within ~1s.
6. Studio → Edge Functions → push-on-message → Logs should show a
   `200` response with `{ "ticket": { "status": "ok" } }`.

## Troubleshooting

If the function never gets called (no log activity), the trigger isn't
firing. Quickest checks in **SQL Editor**:

```sql
-- Trigger exists?
SELECT tgname FROM pg_trigger WHERE tgname = 'on_message_inserted_push';

-- Vault secret exists and is readable?
SELECT name FROM vault.decrypted_secrets WHERE name = 'service_role_key';

-- pg_net enabled?
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Inspect recent pg_net request queue:
SELECT id, url, status_code, error_msg, created
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
```

If `vault.decrypted_secrets` returns no rows, the secret isn't set.
Re-do step 3.

If `net._http_response` shows a `401`, the secret is wrong. Copy the
service_role key again from API settings and update the Vault secret.

If `net._http_response` shows a `404`, the function isn't deployed.
Re-run `npx supabase functions deploy push-on-message`.

If you see `{ "skipped": "no_push_token" }` in the function logs, the
recipient's `profiles.push_token` is `NULL` — the mobile app didn't
register a token (permission denied or `lib/pushNotifications.ts` didn't
run on launch).

## Local dev (optional, requires Docker)

```bash
npx supabase start
npx supabase functions serve push-on-message --env-file ./supabase/.env.local
```

with `./supabase/.env.local`:
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<from `npx supabase status`>
EXPO_ACCESS_TOKEN=
```

## Architecture notes

- Trigger is `AFTER INSERT FOR EACH ROW` on `messages` — fires once per
  new message.
- `net.http_post` is **async**. The INSERT statement returns immediately;
  the HTTP call happens in pg_net's background worker. So a slow Expo
  Push call never blocks message sending.
- If Vault doesn't have the secret, the trigger silently no-ops —
  message INSERTs never fail because of push misconfig.
- Bad-token cleanup: when Expo returns `DeviceNotRegistered`, the
  function clears the bad token from `profiles.push_token` so we don't
  retry forever.
