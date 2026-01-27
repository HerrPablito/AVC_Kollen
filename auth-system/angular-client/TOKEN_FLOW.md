# Token Flow & Security Model

Complete explanation of the JWT authentication flow in this Angular application.

## Overview

This application uses a **dual-token strategy** for authentication:
- **Access Token**: Short-lived (15 minutes), stored in memory
- **Refresh Token**: Long-lived (30 days), stored in HttpOnly cookie

---

## 1. Registration/Login Flow

### Step-by-Step Process

```
User → Angular App → Backend API → Database
```

**1.1 User submits credentials**
- User enters email + password in login/register form
- Angular validates form (required fields, email format, min length)

**1.2 Angular sends request to backend**
```typescript
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
// withCredentials: true (allows cookies)
```

**1.3 Backend processes request**
- Validates credentials
- Hashes password with bcrypt (register) or compares hash (login)
- Generates two JWT tokens:
  - Access token (15 min expiry)
  - Refresh token (30 days expiry)
- Stores refresh token in database
- Sets refresh token as HttpOnly cookie

**1.4 Backend responds**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```
**Plus** `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict`

**1.5 Angular stores tokens**
- **Access token**: Stored in memory (`AuthService.accessToken`)
- **Refresh token**: Automatically stored by browser in cookies (HttpOnly)
- User object: Stored in `BehaviorSubject` for reactive updates

---

## 2. Access Token Storage (In-Memory)

### Why In-Memory?

✅ **Pros:**
- Not accessible to JavaScript (XSS protection)
- Automatically cleared on page reload
- No persistence = shorter attack window

❌ **Cons:**
- Lost on page reload (requires refresh flow)

### Implementation

```typescript
// AuthService
private accessToken: string | null = null;

getAccessToken(): string | null {
    return this.accessToken;
}
```

**Key Point**: Access token is NEVER stored in `localStorage` or `sessionStorage` to prevent XSS attacks.

---

## 3. HTTP Interceptor Behavior

### Automatic Token Injection

Every HTTP request to the API automatically gets the access token:

```typescript
// Before interceptor
GET /me

// After interceptor
GET /me
Authorization: Bearer eyJhbGc...
```

### 401 Handling & Token Refresh

When an access token expires (after 15 minutes):

```
Request → 401 Response → Refresh Token → Retry Request
```

**Step-by-Step:**

1. **Request fails with 401**
   ```
   GET /me
   Response: 401 Unauthorized
   ```

2. **Interceptor catches 401**
   - Checks if already refreshing (prevents multiple refresh calls)
   - Sets `isRefreshing = true`

3. **Calls refresh endpoint**
   ```typescript
   POST /auth/refresh
   // Refresh token sent automatically in cookie
   ```

4. **Backend validates refresh token**
   - Checks cookie for refresh token
   - Verifies token signature and expiry
   - Checks database for token existence
   - Generates new access token

5. **Backend responds**
   ```json
   {
     "message": "Token refreshed successfully",
     "accessToken": "eyJhbGc..." // New token
   }
   ```

6. **Interceptor updates token**
   ```typescript
   authService.setAccessToken(newToken);
   ```

7. **Retry original request**
   ```
   GET /me
   Authorization: Bearer <new_token>
   Response: 200 OK
   ```

8. **Reset refresh flag**
   ```typescript
   isRefreshing = false;
   ```

### If Refresh Fails

```
Refresh fails → Logout → Clear state → Redirect to /login
```

---

## 4. Page Reload Handling

### The Problem

When user refreshes the page:
- **Access token** (in memory) is lost ❌
- **Refresh token** (in cookie) persists ✅

### The Solution: APP_INITIALIZER

Angular automatically attempts token refresh on app startup:

```typescript
// app.config.ts
{
  provide: APP_INITIALIZER,
  useFactory: (authService: AuthService) => {
    return () => authService.initializeAuth().toPromise();
  },
  deps: [AuthService],
  multi: true
}
```

**Flow:**

1. **App starts** (page reload or first visit)
2. **APP_INITIALIZER runs** before app renders
3. **Calls** `authService.initializeAuth()`
4. **Attempts** `POST /auth/refresh`
   - If refresh cookie exists → Success → Get new access token
   - If no cookie or expired → Fail → User not authenticated
5. **Fetches user profile** if refresh succeeds
6. **App renders** with correct auth state

**Result:**
- User stays logged in after page reload ✅
- Seamless experience (no re-login required)

---

## 5. HttpOnly Cookies vs localStorage

### Why HttpOnly Cookies for Refresh Tokens?

| Feature | HttpOnly Cookie | localStorage |
|---------|----------------|--------------|
| **JavaScript Access** | ❌ No (secure) | ✅ Yes (vulnerable) |
| **XSS Protection** | ✅ Protected | ❌ Vulnerable |
| **CSRF Protection** | ⚠️ Needs SameSite | ✅ Not affected |
| **Auto-sent with requests** | ✅ Yes | ❌ Manual |
| **Cleared on browser close** | Optional | ❌ Persists |

### Security Benefits

**HttpOnly Cookie:**
```
Set-Cookie: refreshToken=abc123; 
  HttpOnly;           // Not accessible via JavaScript
  Secure;             // Only sent over HTTPS
  SameSite=Strict;    // CSRF protection
  Max-Age=2592000     // 30 days
```

**Why this is secure:**

1. **XSS Protection**: Even if attacker injects malicious JavaScript, they cannot read the refresh token
2. **HTTPS Only**: Token only transmitted over encrypted connections
3. **SameSite**: Prevents CSRF attacks by not sending cookie with cross-site requests
4. **Automatic**: Browser handles sending cookie, no manual code needed

**localStorage (NOT USED):**
```typescript
// ❌ NEVER DO THIS
localStorage.setItem('refreshToken', token);
// Any JavaScript can read this:
const stolen = localStorage.getItem('refreshToken');
```

---

## 6. Complete Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER LOGIN                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Angular Login   │
                    │    Component     │
                    └──────────────────┘
                              │
                              ▼
                    POST /auth/login
                    { email, password }
                    withCredentials: true
                              │
                              ▼
                    ┌──────────────────┐
                    │  Backend API     │
                    │  - Verify creds  │
                    │  - Generate JWT  │
                    └──────────────────┘
                              │
                              ▼
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    Access Token (Response)        Refresh Token (Cookie)
    Stored in memory               HttpOnly, Secure
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  AuthService     │
                    │  - Store token   │
                    │  - Set user      │
                    └──────────────────┘
                              │
                              ▼
                    Navigate to /dashboard

┌─────────────────────────────────────────────────────────────┐
│                    PROTECTED REQUEST                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        GET /me
                              │
                              ▼
                    ┌──────────────────┐
                    │  HTTP Interceptor│
                    │  Add: Auth Bearer│
                    └──────────────────┘
                              │
                              ▼
              Authorization: Bearer <access_token>
                              │
                              ▼
                    ┌──────────────────┐
                    │  Backend API     │
                    │  - Verify JWT    │
                    │  - Return data   │
                    └──────────────────┘
                              │
                              ▼
                        200 OK + Data

┌─────────────────────────────────────────────────────────────┐
│                    TOKEN EXPIRED (401)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        GET /me
                        401 Unauthorized
                              │
                              ▼
                    ┌──────────────────┐
                    │  HTTP Interceptor│
                    │  Catch 401       │
                    └──────────────────┘
                              │
                              ▼
                    POST /auth/refresh
                    (cookie sent auto)
                              │
                              ▼
                    ┌──────────────────┐
                    │  Backend API     │
                    │  - Verify cookie │
                    │  - New token     │
                    └──────────────────┘
                              │
                              ▼
                    New Access Token
                              │
                              ▼
                    ┌──────────────────┐
                    │  Interceptor     │
                    │  - Update token  │
                    │  - Retry request │
                    └──────────────────┘
                              │
                              ▼
                    GET /me (with new token)
                              │
                              ▼
                        200 OK + Data

┌─────────────────────────────────────────────────────────────┐
│                      PAGE RELOAD                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  APP_INITIALIZER │
                    │  (before render) │
                    └──────────────────┘
                              │
                              ▼
                    POST /auth/refresh
                    (cookie sent auto)
                              │
                              ▼
                    ┌──────────────────┐
                    │  Backend API     │
                    │  - Check cookie  │
                    │  - New token     │
                    └──────────────────┘
                              │
                              ▼
                    New Access Token
                              │
                              ▼
                    ┌──────────────────┐
                    │  AuthService     │
                    │  - Store token   │
                    │  - Fetch user    │
                    └──────────────────┘
                              │
                              ▼
                    App renders (logged in)
```

---

## 7. Security Summary

| Security Feature | Implementation | Benefit |
|-----------------|----------------|---------|
| **Password Hashing** | bcrypt (10 rounds) | Passwords never stored in plain text |
| **Access Token** | In-memory storage | XSS protection, auto-cleared on reload |
| **Refresh Token** | HttpOnly cookie | Cannot be accessed by JavaScript |
| **HTTPS** | Secure flag on cookies | Encrypted transmission |
| **SameSite** | Strict/Lax | CSRF protection |
| **Token Expiry** | 15 min (access), 30 days (refresh) | Limited attack window |
| **Auto Refresh** | Interceptor + APP_INITIALIZER | Seamless UX, no manual refresh |
| **Single Refresh** | `isRefreshing` flag | Prevents refresh loops |
| **Database Tokens** | Refresh tokens stored in DB | Revocation capability |

---

## 8. Common Scenarios

### Scenario 1: User logs in and uses app
1. Login → Get tokens
2. Access protected routes → Access token in header
3. Token expires after 15 min → Auto-refresh → Continue using app
4. Close browser → Refresh cookie persists (30 days)
5. Open browser next day → Auto-refresh on startup → Still logged in

### Scenario 2: User logs out
1. Click logout button
2. POST /auth/logout → Backend deletes refresh token from DB
3. Clear refresh cookie
4. Clear in-memory access token
5. Clear user state
6. Redirect to /login

### Scenario 3: Refresh token expires (after 30 days)
1. User tries to access app
2. APP_INITIALIZER attempts refresh
3. Refresh fails (token expired)
4. User redirected to /login
5. Must log in again

### Scenario 4: XSS Attack
1. Attacker injects malicious script
2. Script tries to steal tokens
3. **Access token**: In memory, not accessible ✅
4. **Refresh token**: HttpOnly cookie, not accessible ✅
5. Attack fails

---

## Key Takeaways

1. **Access tokens** are short-lived and stored in memory for security
2. **Refresh tokens** are long-lived and stored in HttpOnly cookies
3. **Interceptor** automatically handles token injection and refresh
4. **APP_INITIALIZER** maintains session across page reloads
5. **HttpOnly cookies** provide superior security vs localStorage
6. **Automatic refresh** provides seamless user experience
7. **Single refresh attempt** prevents infinite loops
