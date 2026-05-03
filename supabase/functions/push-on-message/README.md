# push-on-message

Supabase Edge Function that fires an Expo Push notification when a new
`messages` row is inserted.

## Deploy

You need the [Supabase CLI](https://supabase.com/docs/guides/cli) authenticated to the linked project (`supabase login` once, then `supabase link --project-ref <ref>` if not already linked).

```bash
supabase functions deploy push-on-message
```

## Wire the webhook

Two steps in Supabase Studio (one-time):

1. **Database → Webhooks → Create a new hook**
   - Name: `messages_push`
   - Table: `public.messages`
   - Events: `Insert` only
   - Type: `Supabase Edge Functions`
   - Edge Function: `push-on-message`
   - Method: `POST`
   - Headers: leave defaults — Studio injects the service-role authorization automatically.
   - Save.

2. (Optional, only if Expo Enhanced Security is enabled on your Expo
   project) **Settings → Edge Functions → Secrets**:
   ```
   EXPO_ACCESS_TOKEN=<token from expo.dev/accounts/.../settings/access-tokens>
   ```
   The function falls back to anonymous Expo Push if this is unset, which
   is fine for development.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the
Supabase Edge Functions runtime; you don't set those.

## Verify

1. From the mobile app, sign in as a client whose coach has sent a
   message.
2. Background the app.
3. From the dashboard, send a message in their thread.
4. The mobile device should receive an OS notification within ~1s.
5. In Studio → Edge Functions → push-on-message → Logs, you should see a
   `200` response with `{ "ticket": { "status": "ok" } }`.

If the function returns `{ "skipped": "no_push_token" }`, the recipient's
`profiles.push_token` is null — the mobile app didn't register a token
yet. Check `lib/pushNotifications.ts` runs on app launch.

## Local dev

```bash
supabase functions serve push-on-message --env-file ./supabase/.env.local
```

with `./supabase/.env.local` containing:
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<local service role key from `supabase status`>
EXPO_ACCESS_TOKEN=
```

Then POST a webhook-shaped payload manually:

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/push-on-message \
  -H "Authorization: Bearer <local service role key>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "messages",
    "schema": "public",
    "record": {
      "id": "00000000-0000-0000-0000-000000000001",
      "conversation_id": "00000000-0000-0000-0000-000000000002",
      "sender_id": "<some real auth.users.id>",
      "recipient_id": "<recipient with push_token set>",
      "content": "test push",
      "message_type": "text",
      "created_at": "2026-05-02T20:00:00Z"
    },
    "old_record": null
  }'
```
