# Angular JWT Authentication Client

Angular 21 client application with complete JWT authentication integration.

## Features

- ✅ **In-Memory Token Storage** - Access tokens stored in memory (not localStorage)
- ✅ **HttpOnly Refresh Tokens** - Secure refresh tokens in cookies
- ✅ **Automatic Token Refresh** - Seamless token renewal on 401 errors
- ✅ **Route Protection** - Auth guard for protected routes
- ✅ **Reactive Forms** - Form validation and error handling
- ✅ **Modern UI** - Clean, responsive design
- ✅ **APP_INITIALIZER** - Auto-login on page reload

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see parent directory)

### Installation

```bash
cd angular-client
npm install
```

### Development

```bash
# Start dev server
npm start

# App will be available at http://localhost:4200
```

### Build for Production

```bash
npm run build

# Output in dist/angular-client/browser/
```

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts          # Route protection
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts    # Token injection & 401 handling
│   │   ├── models/
│   │   │   └── user.model.ts          # TypeScript interfaces
│   │   └── services/
│   │       └── auth.service.ts        # Authentication logic
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/                 # Login component
│   │   │   └── register/              # Register component
│   │   └── dashboard/                 # Protected dashboard
│   ├── app.component.ts
│   ├── app.config.ts                  # App configuration
│   └── app.routes.ts                  # Routing
└── environments/
    ├── environment.ts                 # Production config
    └── environment.development.ts     # Development config
```

## Configuration

### Environment Variables

**Development** (`environment.development.ts`):
```typescript
export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000'
};
```

**Production** (`environment.ts`):
```typescript
export const environment = {
    production: true,
    apiUrl: 'https://your-backend-url.com'
};
```

## Usage

### Authentication Flow

1. **Register/Login**
   - Navigate to `/login` or `/register`
   - Submit credentials
   - Access token stored in memory
   - Refresh token stored in HttpOnly cookie

2. **Access Protected Routes**
   - Navigate to `/dashboard`
   - Auth guard checks authentication
   - Redirects to `/login` if not authenticated

3. **Automatic Token Refresh**
   - When access token expires (15 min)
   - Interceptor catches 401 error
   - Automatically refreshes token
   - Retries original request

4. **Page Reload**
   - APP_INITIALIZER runs on startup
   - Attempts to refresh token
   - User stays logged in if refresh cookie exists

5. **Logout**
   - Click logout button
   - Clears tokens and user state
   - Redirects to `/login`

### API Integration

All HTTP requests automatically include:
- `Authorization: Bearer <access_token>` header
- `withCredentials: true` for cookies

Example:
```typescript
// In any component
constructor(private http: HttpClient) {}

getData() {
    // Token automatically added by interceptor
    return this.http.get('http://localhost:3000/api/data');
}
```

## Security Features

- **XSS Protection**: Access tokens in memory, refresh tokens in HttpOnly cookies
- **CSRF Protection**: SameSite cookie attribute
- **Automatic Refresh**: Seamless token renewal
- **Route Guards**: Prevent unauthorized access
- **Form Validation**: Client-side validation
- **Error Handling**: User-friendly error messages

## Documentation

- [TOKEN_FLOW.md](./TOKEN_FLOW.md) - Detailed token flow explanation
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Production deployment guide

## Testing

### Manual Testing

1. **Start backend**:
   ```bash
   cd ../
   docker compose up
   ```

2. **Start Angular**:
   ```bash
   npm start
   ```

3. **Test flow**:
   - Register new user
   - Login
   - Access dashboard
   - Refresh page (should stay logged in)
   - Wait 15+ min or delete token (should auto-refresh)
   - Logout

### Check Cookies

1. Open DevTools → Application → Cookies
2. Verify `refreshToken` cookie:
   - ✅ HttpOnly
   - ✅ Secure (in production)
   - ✅ SameSite

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Cloudflare Pages

```bash
# Build
npm run build

# Deploy (from project root)
npx wrangler pages deploy dist/angular-client/browser
```

## Troubleshooting

### Cookies Not Working

- Ensure backend has `credentials: true` in CORS
- Ensure Angular uses `withCredentials: true`
- Check `sameSite` and `secure` cookie attributes

### 401 Errors

- Check access token is being sent
- Verify backend JWT secret matches
- Check token expiry time

### CORS Errors

- Verify backend CORS origin matches frontend URL
- Ensure `credentials: true` on both sides
- Check preflight OPTIONS requests

## License

MIT
