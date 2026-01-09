# JWT Service Architecture

## Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Pinntag AI Application                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Uses
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      JWT Authentication System                   │
│                                                                   │
│  ┌────────────────────┐              ┌─────────────────────┐   │
│  │   JWT Service      │◄─────────────│  Express Middleware │   │
│  │  (jwt.service.ts)  │              │  (jwtAuth.ts)       │   │
│  │                    │              │                     │   │
│  │  • verify()        │              │  • verifyPinntagJwt │   │
│  │  • decode()        │              │  • optionalJwt      │   │
│  │  • isExpired()     │              │  • requireRole()    │   │
│  │  • getExpiration() │              │  • requireBusiness  │   │
│  └────────────────────┘              └─────────────────────┘   │
│           ▲                                      │               │
│           │                                      │               │
│           │ Uses Secret                          │ Attaches to   │
│           │                                      │               │
│  ┌────────┴────────┐                            │               │
│  │  Configuration   │                            │               │
│  │    (env.ts)      │                            │               │
│  │                  │                            │               │
│  │  JWT_SECRET ────┼────────────────────────────┤               │
│  └─────────────────┘                            │               │
└────────────────────────────────────────────────┼────────────────┘
                                                  │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │    Your Routes          │
                                    │  (*.routes.ts)          │
                                    │                         │
                                    │  app.get('/protected',  │
                                    │    verifyPinntagJwt,    │
                                    │    handler)             │
                                    └─────────────────────────┘
```

## Request Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. HTTP Request with
     │    Authorization: Bearer <JWT>
     ▼
┌────────────────────────────────┐
│  Express Application           │
│                                 │
│  ┌──────────────────────────┐  │
│  │  verifyPinntagJwt        │  │
│  │  Middleware              │  │
│  └───────┬──────────────────┘  │
│          │                      │
│          │ 2. Extract token     │
│          │    from header       │
│          ▼                      │
│  ┌──────────────────────────┐  │
│  │  JWT Service             │  │
│  │  • Verify signature      │  │
│  │  • Check expiration      │  │
│  │  • Decode payload        │  │
│  └───────┬──────────────────┘  │
│          │                      │
│          │ 3. Return result     │
│          ▼                      │
│  ┌──────────────────────────┐  │
│  │  Middleware Decision     │  │
│  │                          │  │
│  │  Valid? ─────────┐       │  │
│  │   ├─Yes─► Attach │       │  │
│  │   │       to req.user     │  │
│  │   │                       │  │
│  │   └─No──► Return 401      │  │
│  └───────┬──────────────────┘  │
│          │                      │
│          │ 4. Continue if valid │
│          ▼                      │
│  ┌──────────────────────────┐  │
│  │  Route Handler           │  │
│  │  • Access req.user       │  │
│  │  • Business logic        │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

## Data Flow

```
Environment Variable (.env)
    │
    │ PINNTAG_BACKEND_JWT_SECRET='...'
    ▼
Configuration (env.ts)
    │
    │ Validates & Exports
    ▼
JWT Service (jwt.service.ts)
    │
    │ Uses Secret to verify tokens
    ▼
Middleware (jwtAuth.ts)
    │
    │ Calls JWT Service
    ▼
Routes
    │
    │ Access req.user
    ▼
Business Logic
```

## Component Responsibilities

### JWT Service (`jwt.service.ts`)
**Responsibility**: Core JWT operations

```typescript
┌────────────────────────────────────┐
│        JWT Service                 │
├────────────────────────────────────┤
│  verify(token)                     │
│  ├─ Verify signature               │
│  ├─ Check expiration               │
│  └─ Return payload or error        │
│                                    │
│  decode(token)                     │
│  └─ Decode without verification    │
│                                    │
│  verifyFromHeader(authHeader)      │
│  ├─ Extract Bearer token           │
│  └─ Call verify()                  │
│                                    │
│  isExpired(token)                  │
│  getExpirationDate(token)          │
│  getTimeToExpiration(token)        │
└────────────────────────────────────┘
```

### Middleware (`jwtAuth.ts`)
**Responsibility**: Express integration & authorization

```typescript
┌────────────────────────────────────┐
│        Middleware Layer            │
├────────────────────────────────────┤
│  verifyPinntagJwt                  │
│  ├─ Extract Authorization header   │
│  ├─ Call jwtService.verify()       │
│  ├─ Attach payload to req.user     │
│  └─ Return 401 if invalid          │
│                                    │
│  optionalPinntagJwt                │
│  ├─ Same as above but optional     │
│  └─ Continue even if invalid       │
│                                    │
│  requireRole(roles...)             │
│  ├─ Check req.user.role            │
│  └─ Return 403 if unauthorized     │
│                                    │
│  requireBusinessAccess             │
│  ├─ Check req.user.businessId      │
│  └─ Return 403 if no access        │
└────────────────────────────────────┘
```

## Token Structure

```
┌───────────────────────────────────────────────────────────┐
│                     JWT Token                              │
├───────────────────────────────────────────────────────────┤
│  Header                                                    │
│  {                                                         │
│    "alg": "HS256",                                        │
│    "typ": "JWT"                                           │
│  }                                                         │
├───────────────────────────────────────────────────────────┤
│  Payload                                                   │
│  {                                                         │
│    "userId": "user123",                                   │
│    "email": "user@example.com",                           │
│    "role": "admin",                                       │
│    "businessId": "business456",                           │
│    "iat": 1234567890,  // Issued at                       │
│    "exp": 1234571490   // Expiration                      │
│  }                                                         │
├───────────────────────────────────────────────────────────┤
│  Signature                                                 │
│  HMACSHA256(                                              │
│    base64UrlEncode(header) + "." +                        │
│    base64UrlEncode(payload),                              │
│    PINNTAG_BACKEND_JWT_SECRET                             │
│  )                                                         │
└───────────────────────────────────────────────────────────┘
```

## Authorization Layers

```
Layer 1: Authentication
┌────────────────────────┐
│  Is token valid?       │
│  verifyPinntagJwt      │
└───────┬────────────────┘
        │
        ▼
Layer 2: Role-Based
┌────────────────────────┐
│  Does user have role?  │
│  requireRole('admin')  │
└───────┬────────────────┘
        │
        ▼
Layer 3: Resource-Based
┌────────────────────────┐
│  Can access resource?  │
│  requireBusinessAccess │
└───────┬────────────────┘
        │
        ▼
    Route Handler
```

## Error Handling Flow

```
Token Received
    │
    ├─ Missing? ──────────► 401 "Authorization header is required"
    │
    ├─ Invalid format? ───► 401 "Invalid Authorization header format"
    │
    ├─ Invalid signature? ► 401 "Invalid token"
    │
    ├─ Expired? ──────────► 401 "Token has expired" (expired: true)
    │
    ├─ Wrong role? ───────► 403 "Insufficient permissions"
    │
    ├─ Wrong business? ───► 403 "No access to this business"
    │
    └─ Valid ─────────────► Continue to route handler
```

## File Dependencies

```
src/config/env.ts
    ↓ exports env
src/api/services/jwt.service.ts
    ↓ uses env.JWT_SECRET
    ↓ exports jwtService
src/middleware/jwtAuth.ts
    ↓ uses jwtService
    ↓ exports middleware functions
src/api/routes/*.routes.ts
    ↓ uses middleware
    ↓ accesses req.user
Your Route Handlers
```

## Security Model

```
┌─────────────────────────────────────────┐
│           Security Layers                │
├─────────────────────────────────────────┤
│  1. HTTPS (Transport)                   │
│     └─ Encrypt token in transit         │
│                                          │
│  2. JWT Signature (Integrity)           │
│     └─ Verify token not tampered        │
│                                          │
│  3. Expiration (Temporal)               │
│     └─ Token has limited lifetime       │
│                                          │
│  4. Secret (Confidentiality)            │
│     └─ Only trusted parties can sign    │
│                                          │
│  5. Authorization (Access Control)      │
│     ├─ Role-based (requireRole)         │
│     └─ Resource-based (requireBusiness) │
└─────────────────────────────────────────┘
```

## Integration Points

```
┌──────────────────────────────────────────────────────┐
│               External Systems                        │
└──────────────────────────────────────────────────────┘
                        │
                        │ JWT Token (signed)
                        ▼
┌──────────────────────────────────────────────────────┐
│            Pinntag Backend (Token Issuer)            │
│  • Signs tokens with PINNTAG_BACKEND_JWT_SECRET      │
│  • Issues tokens on login/authentication             │
└──────────────────────────────────────────────────────┘
                        │
                        │ User includes in requests
                        ▼
┌──────────────────────────────────────────────────────┐
│            Pinntag AI (Token Verifier)               │
│  • Verifies tokens with same secret                 │
│  • Extracts user info from payload                  │
│  • Authorizes access to resources                   │
└──────────────────────────────────────────────────────┘
```

## Usage Patterns

### Pattern 1: Simple Protection
```
Route → verifyPinntagJwt → Handler
```

### Pattern 2: Role-Based
```
Route → verifyPinntagJwt → requireRole → Handler
```

### Pattern 3: Business-Scoped
```
Route → verifyPinntagJwt → requireBusinessAccess → Handler
```

### Pattern 4: Combined Authorization
```
Route → verifyPinntagJwt → requireRole → requireBusinessAccess → Handler
```

### Pattern 5: Optional Auth
```
Route → optionalPinntagJwt → Handler (checks req.user)
```

### Pattern 6: Custom Logic
```
Route → verifyPinntagJwt → Handler (custom authorization)
```
