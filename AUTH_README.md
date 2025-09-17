# API Customers - Authentication System

This API provides JWT-based authentication and authorization services for the microservices architecture.

## Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Customer and Admin roles with different permissions
- **Password Hashing**: Secure password storage using bcrypt
- **Token Validation**: External API validation endpoints
- **User Management**: Complete CRUD operations for customers

## API Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "postalCode": "10001",
  "country": "USA",
  "role": "customer" // Optional: "customer" (default) or "admin"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "customer",
    // ... other customer fields (without password)
  }
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <jwt_token>
```

#### Validate Token (for internal use)
```http
POST /auth/validate
Authorization: Bearer <jwt_token>
```

#### Validate Permission (for other microservices)
```http
POST /auth/validate-permission
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requiredRole": "admin" // Optional
}
```

Response:
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "role": "customer"
  }
}
```

### Customer Management

#### Get All Customers (Admin only)
```http
GET /customers
Authorization: Bearer <admin_jwt_token>
```

#### Get Customer Profile (Own profile or Admin)
```http
GET /customers/me
Authorization: Bearer <jwt_token>

GET /customers/:id  # Admin only
Authorization: Bearer <admin_jwt_token>
```

#### Update Customer Profile
```http
PATCH /customers/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "phone": "+0987654321"
}

PATCH /customers/:id  # Admin only
Authorization: Bearer <admin_jwt_token>
```

#### Create Customer (Admin only)
```http
POST /customers
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "password": "securepassword123",
  // ... other customer fields
}
```

#### Delete Customer (Admin only)
```http
DELETE /customers/:id
Authorization: Bearer <admin_jwt_token>
```

## Roles and Permissions

### Customer Role
- Can register and login
- Can view and update their own profile
- Can access customer-specific endpoints

### Admin Role  
- All customer permissions
- Can view all customers
- Can create, update, and delete any customer
- Can access admin-specific endpoints

## Inter-Service Authentication

Other microservices can validate user tokens by calling:

```http
POST http://api-customers:3000/auth/validate-permission
Content-Type: application/json

{
  "token": "user_jwt_token",
  "requiredRole": "admin"  // Optional: specify required role
}
```

This allows other services to:
1. Verify if a token is valid
2. Get user information from the token
3. Check if the user has sufficient permissions

## Environment Variables

Add these to your `.env` file:

```env
# Database
DB_HOST=db
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_NAME=api_customers

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h
```

## Usage in Other Microservices

### Example: Protecting an endpoint in api-orders

```typescript
// In api-orders service
async function validateUserPermission(token: string, requiredRole?: string) {
  const response = await fetch('http://api-customers:3000/auth/validate-permission', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      requiredRole,
    }),
  });

  const result = await response.json();
  return result;
}

// Middleware example
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const validation = await validateUserPermission(token);
  
  if (!validation.valid) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.user = validation.user;
  next();
}
```

## Database Schema

The `customers` table includes:

- `id`: Primary key
- `firstName`, `lastName`: User names
- `email`: Unique email address
- `password`: Hashed password (bcrypt)
- `phone`: Optional phone number
- `role`: Enum ('customer', 'admin')
- `address`, `city`, `postalCode`, `country`: Address information
- `type`: Enum ('individual', 'professional')
- `isActive`: Boolean for account status
- `createdAt`, `updatedAt`: Timestamps

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
2. **JWT Security**: Tokens expire after 24 hours by default
3. **Role-based Access**: Different endpoints require different roles
4. **Input Validation**: All inputs are validated using class-validator
5. **Active Account Check**: Only active accounts can authenticate

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Build for production
npm run build

# Run in production mode  
npm run start:prod
```