# Environment Configuration

## Setup Instructions

1. Create a `.env.local` file in the root directory of your project.

2. Add the following environment variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api

# Application Configuration
NEXT_PUBLIC_APP_NAME=WatchCash Admin
```

## API Endpoints

The authentication service will use the following endpoints:

- **Login**: `{{baseUrl}}/admin/login` (POST)
- **Register**: `{{baseUrl}}/admin/register` (POST)  
- **Logout**: `{{baseUrl}}/admin/logout` (POST)
- **Get Current User**: `{{baseUrl}}/admin/me` (GET)

## Request/Response Formats

### Login Request
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

### Login Response
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "1",
    "email": "admin@example.com",
    "name": "John Doe"
  }
}
```

### Register Request
```json
{
  "email": "user@example.com",
  "password": "password",
  "name": "User Name"
}
```

### Register Response
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## Authentication Headers

All authenticated requests will include:
```
Authorization: Bearer {token}
Content-Type: application/json
```

## Cookie Management

- Tokens are stored in cookies with `path=/` and `max-age=3600`
- Secure and SameSite settings are enabled for production
- Tokens are automatically cleared on logout
