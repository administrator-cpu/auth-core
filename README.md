# @thediv/auth-core

A headless, enterprise-grade authentication engine for React and Next.js applications.

`@thediv/auth-core` completely decouples authentication logic from the UI. It provides highly configurable React hooks, robust state management via Zustand, automatic token-refresh interceptors for HttpOnly cookies, and strict runtime validation using Zod.

---

## Features

- **UI-Agnostic Headless Hooks** — Bring your own UI components. The core handles all network requests, loading states, and error parsing.
- **Dynamic API Configuration** — Easily override HTTP methods (`GET`, `POST`, `PATCH`, etc.) and endpoints per hook to adapt to any backend architecture.
- **HttpOnly Cookie Support** — Pre-configured Axios instance with `withCredentials: true` and interceptor logic to handle 401 token refreshes seamlessly.
- **Global Session Management** — Built-in Zustand store for secure, accessible session state across your entire application.
- **Strict Type Safety & Validation** — Exported Zod schemas and inferred TypeScript interfaces for frontend form validation.

---

## Installation

```bash
npm install @thediv/auth-core
```

Ensure you have the following peer dependencies installed:

```bash
npm install react react-dom axios zod zustand
```

---

## Environment Configuration

The API client automatically reads your backend URL from environment variables. Add the following to your `.env.local` or `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# Fallbacks: VITE_API_URL, or defaults to http://localhost:5000/api
```

---

## Quick Start: Global Session State

Access the current user's session from anywhere in your application using `useAuth` or `useAuthStore`.

```tsx
```ts
import { useAuth } from '@thediv/auth-core';

// Default: GET /auth/me (Strict Bouncer Mode - No Refresh)
const { user, isAuthenticated, isInitialized, clearSession } = useAuth();

// With Silent Refresh Enabled (Dynamic backend configuration)
const { user } = useAuth({
  endpoint: '/users/me',
  enableRefresh: true,
  refreshEndpoint: '/users/refresh'
});

  if (!isInitialized) return <LoadingSkeleton />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={clearSession}>Log Out</button>
    </div>
  );
};
```

Checks for an existing session on mount by calling the `/auth/me` endpoint (or your custom endpoint). Populates the global store if a valid session is found. Designed to be used once at the application root.

### 2. Update the `Token Refresh & Interceptors` Section
Replace your current Token Refresh section with this detailed breakdown of the dual-mode interceptor you just built:

```markdown
## Token Refresh & Interceptors

The engine includes a dynamic Axios response interceptor that acts as a global security perimeter. Its behavior is fully configurable via the `useAuth` hook:

**1. Strict Bouncer Mode (Default)**
If `enableRefresh` is `false`, the engine acts as a strict gatekeeper. Any `401 Unauthorized` response immediately destroys the global session state and logs the user out. Ideal for architectures relying on long-lived HttpOnly cookies without a separate refresh flow.

**2. Silent Refresh Mode**
If `enableRefresh` is `true`, the interceptor handles expired access tokens seamlessly:
* On a `401` response, the interceptor pauses the original request and fires a `POST` to your configured `refreshEndpoint`.
* If the refresh succeeds, the original request is retried automatically.
* If the refresh fails (e.g. the refresh token is also expired), `clearSession()` is called, logging the user out.
* Concurrent requests that fail during a refresh are queued and retried together once the refresh completes, preventing redundant refresh calls.

> **Note:** The interceptor intelligently bypasses `401` errors that occur on `/login` or `/register` routes, allowing your UI to handle and display standard "Invalid Credentials" errors.

---

## Hook API Reference

All hooks return standard states: `isLoading`, `error`, and `resetError()`, alongside their respective execution functions. Every hook accepts an optional configuration object to override default endpoints and HTTP methods.

---

### `useLogin(options?)`

Handles standard user sign-in and updates the global session upon receiving the HttpOnly cookie.

```ts
import { useLogin } from '@thediv/auth-core';

// Default: POST /auth/login
const { login, isLoading, error, resetError } = useLogin();

// With custom configuration
const { login } = useLogin({
  endpoint: '/v2/users/authenticate',
  method: 'post',
});

const onSubmit = async (data) => {
  const result = await login(data);
  if (result.success) {
    // Route to dashboard
  }
};
```

---

### `useRegister(options?)`

Handles user registration. On success, the UI can route the user to the OTP verification screen.

```ts
import { useRegister } from '@thediv/auth-core';

// Default: POST /auth/register
const { register, isLoading, error, resetError } = useRegister();

const onSubmit = async (data) => {
  const result = await register(data);
  if (result.success) {
    // Route to OTP screen
  }
};
```

---

### `useOTP(options?)`

Manages both verification and resending of One-Time Passwords with independent endpoint configuration.

```ts
import { useOTP } from '@thediv/auth-core';

const { verifyOTP, resendOTP, isLoading, error, resetError } = useOTP({
  verifyEndpoint: '/auth/verify-otp',
  verifyMethod: 'post',
  resendEndpoint: '/user/resend-otp',
  resendMethod: 'post',
});

// Verifying requires the OTP and the associated email
await verifyOTP({ email: 'user@example.com', code: '123456' });

// Resending only requires the email
await resendOTP('user@example.com');
```

---

### `usePassword(options?)`

Handles the two-step forgotten password flow: requesting a reset code and submitting a new password.

```ts
import { usePassword } from '@thediv/auth-core';

// Default multi-step flow
const { 
  requestReset, 
  verifyResetOTP, 
  submitNewPassword, 
  isLoading, 
  error 
} = usePassword({
  // Example of overriding defaults for a specific backend architecture
  verifyEndpoint: '/users/verify-reset-otp',
  resetEndpoint: '/users/reset-password',
  resetMethod: 'patch'
});

// Step 1: Request the reset OTP/link (Default: POST /auth/forgot-password)
await requestReset({ email: 'user@example.com' });

// Step 2: Verify the OTP independently (Default: POST /auth/verify-reset-otp)
await verifyResetOTP({ email: 'user@example.com', otp: '123456' });

// Step 3: Submit new credentials (Default: POST /auth/reset-password)
await submitNewPassword({
  email: 'user@example.com',
  password: 'NewStrongPassword1!'
});
```

> **Developer Notes:** > * **Payload Optimization:** `confirmPassword` is used strictly for frontend validation and is stripped before the network request. Only the required fields (`email`, `password`, and `otp` if applicable) are forwarded to the backend.

> * **Backwards Compatibility:** If your backend handles OTP verification and password updates in a single endpoint, the engine still exports the legacy `resetPassword({ email, otp, password })` function to support 2-step flows.

---

### `useAuth(options?)`

Checks for an existing session on mount by calling the `/auth/me` endpoint. Populates the global store if a valid session is found. Designed to be used once at the application root.

```ts
import { useAuth } from '@thediv/auth-core';

// Default: GET /auth/me
const { user, isAuthenticated, isInitialized, clearSession } = useAuth();

// With custom configuration
const { user } = useAuth({
  endpoint: '/v2/session',
  method: 'get',
});
```

> **Note:** The hook is idempotent — it will not re-fire if `isInitialized` is already `true`, preventing double-calls in React StrictMode.

---

## Zod Schemas

Use the built-in Zod schemas to align your frontend `react-hook-form` validation with backend requirements.

```ts
import {
  loginSchema,
  registerSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@thediv/auth-core';
```

| Schema | Fields |
|---|---|
| `loginSchema` | `email`, `password` |
| `registerSchema` | `name`, `email`, `password` |
| `otpSchema` | `code` (exactly 6 digits) |
| `forgotPasswordSchema` | `email` |
| `resetPasswordSchema` | `password`, `confirmPassword` (with match refinement) |

---

## TypeScript Types

TypeScript interfaces are exported for all payloads and responses.

```ts
import type {
  LoginFormData,
  RegisterFormData,
  OTPFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  User,
  AuthResponse,
  ApiErrorResponse,
} from '@thediv/auth-core';
```

### `User`

```ts
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  [key: string]: any; // Supports flexible extra fields (e.g. avatar, preferences)
}
```

### `AuthResponse`

```ts
interface AuthResponse {
  user: User;
  message?: string;
}
```

---

## Token Refresh & Interceptors

The Axios instance is pre-configured with a response interceptor that automatically handles expired access tokens:

1. On a `401` response, the interceptor fires a `POST /auth/refresh` to silently rotate the HttpOnly cookie.
2. If the refresh succeeds, the original request is retried automatically.
3. If the refresh fails (e.g. the refresh token is also expired), `clearSession()` is called, logging the user out.
4. Concurrent requests that fail during a refresh are queued and retried together once the refresh completes, preventing redundant refresh calls.

---

## Error Handling

All hooks use an internal `safeRequest` wrapper that extracts exact error messages from the backend API response, surfacing clean strings directly to the `error` state — no try/catch required in your UI.

```ts
const { login, error } = useLogin();

// error is a string | null — ready to render directly
if (error) return <p>{error}</p>;
```

In `development` mode, full Axios errors are also logged to the console for easier debugging.

---

## Build Configuration

The package is bundled with `tsup` and ships both CJS and ESM formats with TypeScript declarations and source maps.

```
dist/
├── index.js       # CommonJS
├── index.mjs      # ESM
└── index.d.ts     # TypeScript declarations
```

To build locally:

```bash
npm run build

# Watch mode
npm run dev
```

---

## Project Structure

```
src/
├── api/
│   ├── client.ts          # Axios instance with withCredentials
│   └── interceptors.ts    # 401 token-refresh interceptor
├── hooks/
│   ├── useAuth.ts
│   ├── useLogin.ts
│   ├── useRegister.ts
│   ├── useOTP.ts
│   └── usePassword.ts
├── schemas/
│   └── authSchemas.ts     # Zod schemas + inferred types
├── store/
│   └── authStore.ts       # Zustand session store
├── types/
│   └── index.ts           # Shared TypeScript interfaces
├── utils/
│   └── safeRequest.ts     # Axios error flattener
└── index.ts               # Public API exports
```

---

## Peer Dependencies

| Package | Version |
|---|---|
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |
| `axios` | `^1.0.0` |
| `zod` | `^3.0.0` |
| `zustand` | `^4.0.0` |

---

## License

© Development Innovation Vector Private Limited. All Rights Reserved </>
