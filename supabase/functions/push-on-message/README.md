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

### 3. Set the GUC settings the trigger needs

The trigger built in `20260502_messages_push_trigger.sql` reads
`app.settings.supabase_url` and `app.settings.service_role_key`. Set
them once, in **Studio → SQL Editor**:

```sql
ALTER DATABASE postgres
  SET app.settings.supabase_url = 'https://yckodvjabgkemhddrzle.supabase.co';
ALTER DATABASE postgres
  SET app.settings.service_role_key = '<paste from Project Settings → API → service_role>';
```

> Use the **service_role** key (the long one), not the anon key. Treat it
> like a password — it's already hidden in `extensions.pg_net` requests
> but don't paste it into chats or commits.

### 4. Apply the trigger migration

```bash
npx supabase db push
```

This applies any pending migrations including
`20260502_messages_push_trigger.sql`.

### 5. (Optional) Expo Access Token

Only required if the project has Expo Enhanced Security enabled. Set it
in **Studio → Edge Functions → push-on-message → Secrets**:

```
EXPO_ACCESS_TOKEN=<token from expo.dev/accounts/.../settings/access-tokens>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the
Edge Functions runtime — you don't set those.

## Verify

1. From the mobile app, sign in as a client whose coach is in your
   roster. Confirm you accepted the push permission prompt at first
   launch (`lib/pushNotifications.ts` triggers it).
2. Background the app fully (swipe up).
3. From the dashboard, send them a message.
4. The mobile device should receive an OS notification within ~1s.
5. Studio → Edge Functions → push-on-message → Logs should show a
   `200` response with `{ "ticket": { "status": "ok" } }`.

If you see `{ "skipped": "no_push_token" }`, the recipient's
`profiles.push_token` is `NULL` — the mobile app didn't register a token
yet (permission denied, or `lib/pushNotifications.ts` didn't run on
launch).

If you see no log activity at all, the trigger isn't firing. Check:
- The migration was applied (`SELECT tgname FROM pg_trigger WHERE tgname = 'on_message_inserted_push';`).
- The GUC settings are set
  (`SELECT current_setting('app.settings.supabase_url', true);`
  in SQL Editor — should not be empty).
- The pg_net extension is enabled
  (`SELECT * FROM pg_extension WHERE extname = 'pg_net';`).

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
- If the function URL or key is misconfigured, the trigger silently
  no-ops — message INSERTs never fail because of push misconfig.
- Bad-token cleanup: when Expo returns `DeviceNotRegistered`, the
  function clears the bad token from `profiles.push_token` so we don't
  retry forever.
