# Discord Authentication Flow

## Overview

Users must have a Discord account linked to use the music bot. This document describes the complete authentication flow.

## User Flows

### 1. New User Sign Up

```
/auth/sign-up (email/password)
  ↓
Account created
  ↓
Redirect to /auth/connect-discord
  ↓
User clicks "Connect Discord Account"
  ↓
Discord OAuth flow
  ↓
Discord account linked to user
  ↓
Redirect to /dashboard
```

### 2. Existing User - Sign In with Discord

```
/auth/sign-in → Click "Sign in with Discord"
  ↓
Discord OAuth
  ↓
Redirect to /auth/verify-discord
  ↓
Check: Does user account exist?
  ├─ YES → Redirect to /dashboard
  └─ NO  → Sign out → Redirect to /sign-up with message:
           "No account found with that Discord login. Please sign up first."
```

### 3. Existing User - Sign In with Email/Password

```
/auth/sign-in → Enter email/password
  ↓
Authentication successful
  ↓
Check: Is Discord account linked?
  ├─ YES → Redirect to /dashboard
  └─ NO  → Redirect to /auth/connect-discord
```

### 4. Dashboard Access

```
User navigates to /dashboard
  ↓
Check: Is Discord account linked?
  ├─ YES → Show dashboard with music controls
  └─ NO  → Redirect to /auth/connect-discord
```

## Routes

### `/auth/sign-up`

- Email/password registration form
- Shows warning message if redirected from failed Discord sign-in
- On success: Redirects to `/auth/connect-discord`

### `/auth/sign-in`

- Email/password login form
- "Sign in with Discord" button
- Email/password success: Checks for Discord link, redirects accordingly
- Discord button: Redirects to `/auth/verify-discord`

### `/auth/connect-discord`

- Shows "Connect Discord Account" button
- Required step for all new users
- Also used for existing users who haven't linked Discord
- Checks if Discord already connected → auto-redirect to dashboard
- Discord OAuth callback → `/dashboard`

### `/auth/verify-discord`

- Intermediate verification page after Discord OAuth sign-in
- Checks if user account exists for that Discord login
- **Account exists** → Go to dashboard
- **No account** → Sign out user, redirect to sign-up with message

### `/dashboard`

- Protected route - requires Discord account
- Checks for Discord link on load
- If no Discord → Redirect to `/auth/connect-discord`
- Shows music bot controls (guilds, channels, queue)

## Technical Implementation

### Discord Identity Storage

Discord info is stored in Better Auth's `account` table:

- `providerId`: "discord"
- `accountId`: Discord user ID (snowflake)
- `accessToken`: For Discord API calls (guilds, channels)

### Helper Function

`getDiscordFromSession()` - Extracts Discord info from session:

```typescript
{
  discordUserId: string | null,  // From account.accountId
  discordTag: string | null      // From user.name
}
```

### API Endpoints

All music bot APIs check for Discord account:

- `/api/queue` - Add song to queue
- `/api/guilds` - List user's Discord guilds
- `/api/guilds/{id}/channels` - List voice channels

If no Discord account found → `403 Forbidden`

## Security

1. **Discord OAuth required** - Users can't use the bot without Discord
2. **No Discord sign-in without account** - Discord OAuth alone won't create an account
3. **Account linking enforced** - Dashboard won't load without Discord
4. **Session validation** - All API calls verify session + Discord account

## Benefits

- ✅ Clear user journey - sign up → connect Discord → use bot
- ✅ Prevents Discord-only logins without account creation
- ✅ Forces Discord connection for all users
- ✅ Single source of truth (Discord account table)
- ✅ Better security - explicit account creation step

## Error Messages

### Sign-up page

- "No account found with that Discord login. Please sign up first."
  - Shown when user tries to sign in with Discord but no account exists

### Connect Discord page

- "To use the music bot, you need to connect your Discord account."
  - Shown to new users after sign-up
  - Shown to existing users without Discord link

### API responses

- `403: Discord account not linked. Please connect your Discord account.`
  - Returned when trying to use bot features without Discord

## Testing

### Test Case 1: New User Flow

1. Go to `/auth/sign-up`
2. Create account with email/password
3. Should redirect to `/auth/connect-discord`
4. Click "Connect Discord Account"
5. Complete Discord OAuth
6. Should land on `/dashboard` with music controls

### Test Case 2: Discord Sign-in Without Account

1. Go to `/auth/sign-in`
2. Click "Sign in with Discord"
3. Complete Discord OAuth
4. Should redirect to `/auth/sign-up` with error message
5. No account should be created

### Test Case 3: Email Sign-in Without Discord

1. Create account with email (but don't link Discord)
2. Sign out
3. Sign in with email/password
4. Should redirect to `/auth/connect-discord`
5. Complete Discord connection
6. Should land on `/dashboard`

### Test Case 4: Full Account with Discord

1. User has account + Discord linked
2. Sign in with either method
3. Should go directly to `/dashboard`

## Migration Notes

Existing users who signed up before this change:

- Will be redirected to `/auth/connect-discord` on next dashboard visit
- Must link Discord to continue using the bot
- Previous music bot usage won't work until Discord is linked
