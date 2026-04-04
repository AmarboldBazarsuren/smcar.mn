# Backend API Documentation

## 🌐 Overview

This document provides comprehensive documentation for all available API endpoints in the Car Sell Platform backend.

### Base URL
```
https://apicars.info
```

### Production URL
```
https://apicars.info
```

---

## 📋 Table of Contents

1. [Health & System](#1-health--system)
2. [Authentication](#2-authentication)
3. [Cars Management](#3-cars-management)
4. [Scraping Operations](#4-scraping-operations)
5. [TrioVetura API](#5-triovetura-api)
6. [Admin Panel](#6-admin-panel)
7. [Business Settings](#7-business-settings)
8. [Reservations](#8-reservations)
9. [File Uploads](#9-file-uploads)
10. [Response Format](#response-format)
11. [Authentication](#authentication)
12. [Error Handling](#error-handling)

---

## 1. Health & System

### GET /health
Check the health status of the API and database connection.

**Request:**
```bash
curl https://apicars.info/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-10-16T10:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Service unavailable",
  "timestamp": "2025-10-16T10:00:00.000Z",
  "database": "disconnected",
  "error": "Database connection failed"
}
```

### GET /cors-test
Test CORS configuration.

**Request:**
```bash
curl https://apicars.info/cors-test
```

**Response:**
```json
{
  "success": true,
  "message": "CORS test successful",
  "origin": "http://localhost:3000",
  "corsHeaders": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  }
}
```

### GET /
API root endpoint with available endpoints list.

**Request:**
```bash
curl https://apicars.info/
```

**Response:**
```json
{
  "success": true,
  "message": "Car Sell Platform API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth",
    "cars": "/api/cars",
    "scraping": "/api/scraping",
    "triovetura": "/api/triovetura",
    "luxurycars": "/api/luxurycars",
    "encar": "/api/encar",
    "users": "/api/users",
    "admin": "/api/admin",
    "business-settings": "/api/business-settings"
  }
}
```

---

## 2. Authentication

All authentication endpoints are under `/api/auth`.

### POST /api/auth/login
User login endpoint supporting both admin and regular users.

**Request:**
```bash
curl -X POST https://apicars.info/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Username or email address |
| password | string | Yes | User password |

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "userType": "admin",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Token Expiration:**
- Access Token: 1 day
- Refresh Token: 7 days

---

### POST /api/auth/register
Register a new user account.

**Request:**
```bash
curl -X POST https://apicars.info/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Unique username |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 6 characters) |
| firstName | string | No | User's first name |
| lastName | string | No | User's last name |
| phone | string | No | Phone number |

**Success Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 2,
      "username": "newuser",
      "email": "user@example.com",
      "role": "user",
      "userType": "user"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### POST /api/auth/refresh
Refresh an expired access token using a valid refresh token.

**Request:**
```bash
curl -X POST https://apicars.info/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### POST /api/auth/logout
Logout user and invalidate refresh token.

**Request:**
```bash
curl -X POST https://apicars.info/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### GET /api/auth/verify
Verify the validity of an access token.

**Request:**
```bash
curl https://apicars.info/api/auth/verify \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "userType": "admin"
    }
  }
}
```

---

## 3. Cars Management

All car management endpoints are under `/api/cars`.

### GET /api/cars
Search and filter cars with advanced filtering and pagination.

**Request:**
```bash
curl "https://apicars.info/api/cars?brand=BMW&yearFrom=2020&priceFrom=10000&priceTo=50000&page=1&limit=20"
```

**Query Parameters:**
| Parameter | Type | Description | Default | Validation |
|-----------|------|-------------|---------|------------|
| brand | string | Filter by car brand | - | Optional |
| model | string | Filter by car model (partial match) | - | Optional |
| yearFrom | integer | Minimum year | - | 1900-2026 |
| yearTo | integer | Maximum year | - | 1900-2026 |
| priceFrom | number | Minimum price | - | ≥ 0 |
| priceTo | number | Maximum price | - | ≥ 0 |
| fuelType | string | Filter by fuel type | - | Optional |
| transmission | string | Filter by transmission | - | Optional |
| color | string | Filter by color | - | Optional |
| maxMileage | number | Maximum mileage | - | ≥ 0 |
| sortBy | string | Sort field | relevance | relevance, price, mileage, year, scraped_at |
| sortOrder | string | Sort order | desc | asc, desc |
| page | integer | Page number | 1 | ≥ 1 |
| limit | integer | Items per page | 20 | 1-1000 |

**Success Response:**
```json
{
  "success": true,
  "data": {
    "cars": [
      {
        "id": "123",
        "title": "2024 BMW X5 M Sport Package",
        "brand": "BMW",
        "model": "X5",
        "year": 2024,
        "price": "45000",
        "currency": "EUR",
        "mileage": 12000,
        "fuelType": "Gasoline",
        "transmission": "Auto",
        "location": "South Korea",
        "image": "https://ci.encar.com/carpicture/...",
        "images": [
          "https://ci.encar.com/carpicture/...",
          "https://ci.encar.com/carpicture/..."
        ],
        "type": "SUV",
        "body_type": "SUV",
        "color": "Black",
        "encar_id": "38522583"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    },
    "dataSource": {
      "current": "cars"
    }
  }
}
```

---

### GET /api/cars/:id
Get detailed information for a specific car by ID.

**Request:**
```bash
curl https://apicars.info/api/cars/123
```

**Path Parameters:**
- `id` (string/integer, required): Car ID, car_number, or encar_id

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "title": "2024 BMW X5 M Sport Package",
    "brand": "BMW",
    "model": "X5",
    "year": 2024,
    "price": "45000",
    "currency": "EUR",
    "mileage": 12000,
    "fuelType": "Gasoline",
    "transmission": "Auto",
    "location": "South Korea",
    "image": "https://...",
    "images": ["https://..."],
    "type": "SUV",
    "encar_id": "38522583"
  },
  "meta": {
    "dataSource": "cars"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Car not found"
}
```

---

### GET /api/cars/:id/full
Get full raw record for a car including all database fields.

**Request:**
```bash
curl https://apicars.info/api/cars/123/full
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "title": "2024 BMW X5 M Sport Package",
    "brand": "BMW",
    "model": "X5",
    "year": 2024,
    "price": "45000",
    "original_price": 8240,
    "original_price_krw": 13290000,
    "diagnostic_fee": 100,
    "shipping_fee": 1500,
    "kosovo_transport_fee": 350,
    "commission_fee": 550,
    "extra_fee": 272,
    "discount": 0,
    "body_type": "SUV",
    "seat_count": 5,
    "vehicle_status": "Used",
    "accident": "No accident",
    "color": "Black",
    "grade": "A",
    "encar_id": "38522583",
    "scraped_at": "2025-10-16T10:00:00.000Z",
    "updated_at": "2025-10-16T10:00:00.000Z"
  },
  "meta": {
    "dataSource": "cars"
  }
}
```

---

### GET /api/cars/:id/admin-details
Get admin-only details including sensitive information like VIN and pricing breakdown.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl https://apicars.info/api/cars/123/admin-details \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "vin": "WBADT43452GJ12345",
    "encar_id": "38522583",
    "original_price_eur": 8240,
    "original_price_krw": 13290000,
    "fees": {
      "diagnostic_fee": 100,
      "shipping_fee": 1500,
      "kosovo_transport_fee": 350,
      "commission_fee": 550,
      "extra_fee": 272,
      "discount": 0
    },
    "currency": "EUR",
    "exchange_rates": {
      "provider": "frankfurter",
      "fetched_at": "2025-10-16T08:00:00.000Z",
      "KRW_TO_EUR": 0.00062,
      "EUR_TO_KRW": 1612.9
    }
  }
}
```

---

### GET /api/cars/stats
Get car statistics and count information.

**Request:**
```bash
curl https://apicars.info/api/cars/stats
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "totalCars": 150,
    "highestCarNumber": 150,
    "carsByWebsite": [
      {
        "website": "encar.com",
        "count": 120,
        "latestCarNumber": 150
      },
      {
        "website": "kj-cars.com",
        "count": 30,
        "latestCarNumber": 60
      }
    ]
  }
}
```

---

### GET /api/cars/admin
Get cars for admin interface with full details and price comparison data.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl "https://apicars.info/api/cars/admin?page=1&limit=100&priceFilter=best" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Query Parameters:**
All parameters from `/api/cars` plus:
| Parameter | Type | Description | Values |
|-----------|------|-------------|--------|
| priceFilter | string | Filter by price comparison | all, best, worst, competitive, savings, matches, no-data |
| searchTerm | string | Search in title/description | - |

**Success Response:**
```json
{
  "success": true,
  "data": {
    "cars": [
      {
        "id": 123,
        "title": "2024 BMW X5",
        "brand": "BMW",
        "model": "X5",
        "year": 2024,
        "price": 45000,
        "encar_price": 44000,
        "trio_price": 45500,
        "luxury_price": 46000,
        "best_price": 44000,
        "best_source": "encar",
        "price_difference": 1000,
        "savings": 1000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 150,
      "totalPages": 2
    }
  }
}
```

---

### POST /api/cars/pricing-breakdown
Calculate pricing breakdown for a car including all fees.

**Request:**
```bash
curl -X POST https://apicars.info/api/cars/pricing-breakdown \
  -H "Content-Type: application/json" \
  -d '{
    "originalPrice": 13290000,
    "bodyType": "SUV",
    "discount": 0,
    "isKrw": true
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| originalPrice | number | Yes | Car price (KRW or EUR) |
| bodyType | string | No | Body type for fee calculation |
| discount | number | No | Discount amount |
| isKrw | boolean | No | Whether price is in KRW (default: false) |

**Success Response:**
```json
{
  "success": true,
  "breakdown": {
    "originalPrice": 8240,
    "diagnosticFee": 100,
    "shippingFee": 1500,
    "kosovoTransportFee": 350,
    "commissionFee": 550,
    "extraFee": 272,
    "discount": 0,
    "totalPrice": 11012
  }
}
```

---

### POST /api/cars
Create a new car listing.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/cars \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "title": "2024 BMW X5 M Sport",
    "brand": "BMW",
    "model": "X5",
    "year": 2024,
    "price": 45000,
    "currency": "EUR",
    "mileage": 12000,
    "fuel_type": "Gasoline",
    "transmission": "Automatic",
    "body_type": "SUV",
    "color": "Black",
    "location": "South Korea",
    "description": "Excellent condition BMW X5",
    "image_urls": ["https://example.com/image1.jpg"],
    "source_url": "https://example.com/car/123",
    "source_website": "example.com",
    "source_platform": "manual"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Car created successfully",
  "data": {
    "id": 151,
    "car_number": 151,
    "title": "2024 BMW X5 M Sport",
    "brand": "BMW",
    "model": "X5",
    "year": 2024,
    "price": 45000,
    "created_at": "2025-10-16T10:00:00.000Z"
  }
}
```

---

### PUT /api/cars/:id
Update an existing car listing.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X PUT https://apicars.info/api/cars/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "price": 42000,
    "mileage": 15000,
    "description": "Updated description"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Car updated successfully",
  "data": {
    "id": 123,
    "title": "2024 BMW X5",
    "price": 42000,
    "mileage": 15000,
    "updated_at": "2025-10-16T10:05:00.000Z"
  }
}
```

---

### DELETE /api/cars/:id
Delete a car listing.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X DELETE https://apicars.info/api/cars/123 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Car deleted successfully",
  "data": {
    "id": 123,
    "title": "2024 BMW X5"
  }
}
```

---

### DELETE /api/cars/source/:website
Delete all cars from a specific source website.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X DELETE https://apicars.info/api/cars/source/example.com \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Deleted 25 cars from example.com",
  "data": {
    "deletedCount": 25
  }
}
```

---

### DELETE /api/cars/sold/:encarId
Delete a sold car and save to deleted_cars table.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X DELETE https://apicars.info/api/cars/sold/38522583 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Sold car deleted successfully and saved to deleted_cars table",
  "deletedCar": {
    "encar_id": "38522583",
    "trio_car_id": "12345",
    "manufacturer": "BMW",
    "model": "X5",
    "year": 2024,
    "price": 45000
  }
}
```

---

### GET /api/cars/image-proxy
Proxy images to handle CORS restrictions.

**Request:**
```bash
curl "https://apicars.info/api/cars/image-proxy?url=https://img.encar.com/carpicture/..."
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | Image URL to proxy |

**Allowed Domains:**
- img.encar.com
- kj-cars.com
- img.kbchachacha.com

---

## 4. Scraping Operations

All scraping endpoints are under `/api/scraping`.

### POST /api/scraping/start
Start an asynchronous scraping job that runs in the background.

**Request:**
```bash
curl -X POST https://apicars.info/api/scraping/start \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://automobile.ro/autoturisme/"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | URL to scrape |

**Success Response:**
```json
{
  "success": true,
  "message": "Scraping job started",
  "data": {
    "message": "Scraping job has been queued and will be processed in the background"
  }
}
```

---

### POST /api/scraping/start-sync
Start a synchronous scraping job and wait for completion.

**Request:**
```bash
curl -X POST https://apicars.info/api/scraping/start-sync \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://automobile.ro/autoturisme/"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Scraping completed",
  "data": {
    "jobId": 123,
    "carsFound": 15,
    "totalFound": 15,
    "errors": [],
    "sourceUrl": "https://automobile.ro/autoturisme/",
    "scrapedAt": "2025-10-16T10:00:00.000Z"
  }
}
```

---

### GET /api/scraping/jobs
Get scraping job history with pagination.

**Request:**
```bash
curl "https://apicars.info/api/scraping/jobs?page=1&limit=10"
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max: 100) |

**Success Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 123,
        "url": "https://automobile.ro/autoturisme/",
        "status": "completed",
        "total_cars": 15,
        "scraped_cars": 15,
        "error_message": null,
        "started_at": "2025-10-16T10:00:00.000Z",
        "completed_at": "2025-10-16T10:05:00.000Z",
        "created_at": "2025-10-16T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Job Statuses:**
- `pending` - Job created but not started
- `running` - Job is currently being processed
- `completed` - Job finished successfully
- `failed` - Job failed with error

---

### GET /api/scraping/jobs/:id
Get detailed status of a specific scraping job.

**Request:**
```bash
curl https://apicars.info/api/scraping/jobs/123
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "url": "https://automobile.ro/autoturisme/",
    "status": "completed",
    "total_cars": 15,
    "scraped_cars": 15,
    "error_message": null,
    "started_at": "2025-10-16T10:00:00.000Z",
    "completed_at": "2025-10-16T10:05:00.000Z",
    "created_at": "2025-10-16T10:00:00.000Z"
  }
}
```

---

### POST /api/scraping/process-pending
Manually trigger processing of pending scraping jobs.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/scraping/process-pending \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Pending jobs processing initiated"
}
```

---

## 5. TrioVetura API

All TrioVetura endpoints are under `/api/triovetura`.

### POST /api/triovetura/start-scraping
Start ULTRA-FAST TrioVetura scraping with parallel processing.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/triovetura/start-scraping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "maxPages": 10,
    "perPage": 100,
    "filters": {
      "manufacturer_id": "1",
      "from_year": "2020",
      "buy_now_price_from": "1000",
      "buy_now": "1",
      "status": "3"
    }
  }'
```

**Request Body:**
| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
| maxPages | integer | No | Number of pages to scrape | 10 |
| perPage | integer | No | Cars per page | 100 |
| filters | object | No | Additional filters | {} |

**Available Filters:**
| Filter | Description | Example |
|--------|-------------|---------|
| manufacturer_id | Filter by manufacturer | "1" (BMW) |
| buy_now_price_from | Minimum price | "1000" |
| buy_now_price_to | Maximum price | "50000" |
| from_year | Minimum year | "2020" |
| to_year | Maximum year | "2024" |
| buy_now | Only buy-now cars | "1" |
| status | Car status | "3" (Available) |

**Success Response:**
```json
{
  "success": true,
  "job_id": "trio-scrape-1697123456789",
  "message": "ULTRA-FAST TrioVetura scraping started! Using parallel processing with 5 concurrent batches.",
  "strategy": {
    "requested": {
      "pages": 10,
      "per_page": 100,
      "total": 1000
    },
    "api_calls_needed": 1,
    "cars_per_call": 100,
    "api_limit": 1000,
    "smart_pagination": false,
    "ultra_fast": true,
    "parallel_processing": true,
    "concurrent_batches": 5,
    "batch_size": 50,
    "api_timeout": 5000,
    "direct_bulk_inserts": true
  }
}
```

---

### GET /api/triovetura/info
Get TrioVetura API information and statistics.

**Request:**
```bash
curl https://apicars.info/api/triovetura/info
```

**Success Response:**
```json
{
  "success": true,
  "info": {
    "total_cars": 50000,
    "total_pages": 500,
    "per_page_max": "No limits detected - supports large requests",
    "current_page": 1,
    "sample_data": [
      {
        "id": 12345,
        "title": "2024 BMW X5",
        "manufacturer": {
          "name": "BMW",
          "id": 1
        },
        "year": 2024
      }
    ]
  }
}
```

---

### GET /api/triovetura/job-status/:jobId
Get status of a TrioVetura scraping job.

**Request:**
```bash
curl https://apicars.info/api/triovetura/job-status/trio-scrape-1697123456789
```

**Success Response:**
```json
{
  "success": true,
  "status": {
    "job_id": "trio-scrape-1697123456789",
    "scraper_type": "triovetura",
    "status": "running",
    "start_time": "2025-10-16T10:00:00.000Z",
    "total_scraped": 450,
    "current_page": 5,
    "estimated_completion": "2025-10-16T10:05:00.000Z",
    "logs": [
      "🚀 Starting ULTRA-FAST TrioVetura scraping",
      "📊 Configuration: 10 pages, 100 per page, 5 concurrent batches",
      "⚡ ULTRA-FAST: Parallel processing with 5 concurrent batches"
    ]
  }
}
```

---

### GET /api/triovetura/cars
Get scraped cars from TrioVetura database.

**Request:**
```bash
curl "https://apicars.info/api/triovetura/cars?page=1&limit=50&manufacturer=BMW&year_from=2020"
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| limit | integer | Items per page |
| manufacturer | string | Filter by manufacturer |
| model | string | Filter by model |
| year_from | integer | Minimum year |
| year_to | integer | Maximum year |
| price_from | number | Minimum price |
| price_to | number | Maximum price |

**Success Response:**
```json
{
  "success": true,
  "cars": [
    {
      "id": 1,
      "trio_car_id": 12345,
      "year": 2024,
      "title": "BMW X5 xDrive40i",
      "vin": "WBADT43452GJ12345",
      "manufacturer": "BMW",
      "model": "X5",
      "body_type": "SUV",
      "color": "Black",
      "transmission": "Automatic",
      "fuel": "Gasoline",
      "odometer_km": 12000,
      "buy_now_price": 45000,
      "status": "Available",
      "location_country": "USA",
      "location_city": "Los Angeles",
      "image_urls": ["https://..."],
      "scraped_at": "2025-10-16T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "total_pages": 20
  }
}
```

---

### DELETE /api/triovetura/cars
Clear all scraped TrioVetura cars from database.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X DELETE https://apicars.info/api/triovetura/cars \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Deleted 1000 cars",
  "deleted_count": 1000
}
```

---

## 6. Admin Panel

All admin endpoints are under `/api/admin` and require admin authentication.

### POST /api/admin/create-admin
Create a new admin user (Super Admin only).

**Authentication Required:** Yes (Super Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "username": "newadmin",
    "email": "admin@example.com",
    "password": "securepassword123",
    "role": "admin"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Admin username |
| email | string | Yes | Admin email |
| password | string | Yes | Admin password |
| role | string | No | admin, super_admin, editor (default: admin) |

**Success Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "admin": {
      "id": 2,
      "username": "newadmin",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2025-10-16T10:00:00.000Z"
    }
  }
}
```

---

### GET /api/admin/users
List all regular users.

**Authentication Required:** Yes (Admin, Super Admin, or Editor)

**Request:**
```bash
curl https://apicars.info/api/admin/users \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Found 50 users",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",
        "is_active": true,
        "created_at": "2025-10-16T10:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/admin/admins
List all admin users (Super Admin only).

**Authentication Required:** Yes (Super Admin only)

**Request:**
```bash
curl https://apicars.info/api/admin/admins \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Found 3 admin users",
  "data": {
    "admins": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "super_admin",
        "is_active": true,
        "created_at": "2025-10-15T10:00:00.000Z",
        "updated_at": "2025-10-16T10:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/admin/exchange-rates
Get current exchange rates from database.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl https://apicars.info/api/admin/exchange-rates \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "provider": "frankfurter",
    "fetched_at": "2025-10-16T08:00:00.000Z",
    "KRW_TO_EUR": 0.00062,
    "KRW_TO_USD": 0.00075,
    "EUR_TO_KRW": 1612.9,
    "USD_TO_KRW": 1333.33
  }
}
```

---

### POST /api/admin/exchange-rates/refresh
Fetch live exchange rates and update database.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/admin/exchange-rates/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "provider": "frankfurter"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| provider | string | No | frankfurter or exchangerate.host (default: frankfurter) |

**Success Response:**
```json
{
  "success": true,
  "message": "Exchange rates updated",
  "data": {
    "provider": "frankfurter",
    "fetched_at": "2025-10-16T10:00:00.000Z",
    "KRW_TO_EUR": 0.00062,
    "EUR_TO_KRW": 1612.9
  }
}
```

---

### PUT /api/admin/exchange-rates
Manually set exchange rates in database.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X PUT https://apicars.info/api/admin/exchange-rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "KRW_TO_EUR": 0.00062,
    "provider": "manual"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| KRW_TO_EUR | number | One required | KRW to EUR rate |
| EUR_TO_KRW | number | One required | EUR to KRW rate |
| KRW_TO_USD | number | No | KRW to USD rate |
| USD_TO_KRW | number | No | USD to KRW rate |
| provider | string | No | Rate source (default: manual) |

**Success Response:**
```json
{
  "success": true,
  "message": "Exchange rates set",
  "data": {
    "provider": "manual",
    "fetched_at": "2025-10-16T10:00:00.000Z",
    "KRW_TO_EUR": 0.00062,
    "EUR_TO_KRW": 1612.9
  }
}
```

---

### GET /api/admin/encar-headers
Get current Encar API headers from database.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl https://apicars.info/api/admin/encar-headers \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Current Encar headers retrieved",
  "config": {
    "id": 1,
    "updated_at": "2025-10-16T10:00:00.000Z",
    "is_active": true,
    "headers": {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-encoding": "gzip, deflate, br, zstd",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "referer": "https://www.encar.com/",
      "origin": "https://www.encar.com"
    },
    "headers_count": 10
  }
}
```

---

### POST /api/admin/test-encar-headers
Test if current Encar headers work with the API.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/admin/test-encar-headers \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Headers are working correctly",
  "test_data": {
    "cars_found": 10,
    "response_time_ms": 234
  },
  "timestamp": "2025-10-16T10:00:00.000Z"
}
```

---

### POST /api/admin/reset-encar-headers
Reset Encar headers to default values.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/admin/reset-encar-headers \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Headers reset to default values",
  "config": {
    "id": 1,
    "headers_count": 10,
    "updated_at": "2025-10-16T10:00:00.000Z"
  }
}
```

---

### GET /api/admin/instructions
Get instructions for managing scrape configurations and headers.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl https://apicars.info/api/admin/instructions \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 7. Business Settings

All business settings endpoints are under `/api/business-settings`.

### GET /api/business-settings/public
Get public business settings (no authentication required).

**Request:**
```bash
curl https://apicars.info/api/business-settings/public
```

**Success Response:**
```json
{
  "success": true,
  "settings": {
    "brand_name": "iDrive",
    "company_name": "VeturaZone",
    "contact_address": "Magjistrala Prishtine-Ferizaj, Çagllavice, km.5",
    "contact_city": "Çagllavice",
    "contact_postal_code": "10000",
    "contact_country": "Kosova",
    "contact_phone_1": "048-660-691",
    "contact_phone_2": "049-340-444",
    "contact_phone_3": "044-660-691",
    "contact_email": "info@idrivekorea.com",
    "contact_support_email": "support@idrivekorea.com",
    "logo_url": "/idrive_logo.webp",
    "favicon_url": "/favicon.ico",
    "primary_color": {
      "50": "#eff6ff",
      "500": "#3b82f6",
      "600": "#2563eb"
    },
    "hero_background_image": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
    "hero_overlay_opacity": 0.7
  },
  "timestamp": "2025-10-16T10:00:00.000Z"
}
```

---

### GET /api/business-settings
Get all business settings (authentication required).

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl https://apicars.info/api/business-settings \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "settings": [
    {
      "id": 1,
      "setting_key": "brand_name",
      "setting_value": "iDrive",
      "setting_type": "business_info",
      "description": "Brand name displayed throughout the site",
      "is_active": true,
      "created_at": "2025-10-15T10:00:00.000Z",
      "updated_at": "2025-10-16T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/business-settings/:key
Get a specific business setting by key.

**Request:**
```bash
curl https://apicars.info/api/business-settings/brand_name
```

**Success Response:**
```json
{
  "success": true,
  "setting": {
    "id": 1,
    "setting_key": "brand_name",
    "setting_value": "iDrive",
    "setting_type": "business_info",
    "description": "Brand name displayed throughout the site",
    "is_active": true,
    "created_at": "2025-10-15T10:00:00.000Z",
    "updated_at": "2025-10-16T10:00:00.000Z"
  }
}
```

---

### GET /api/business-settings/type/:type
Get all settings of a specific type.

**Request:**
```bash
curl https://apicars.info/api/business-settings/type/contact
```

**Setting Types:**
- `business_info` - Brand name, company name
- `contact` - Address, phone, email
- `theme` - Color palettes
- `branding` - Logo, favicon
- `hero` - Hero section settings

---

### PUT /api/business-settings/:key
Update a specific business setting.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X PUT https://apicars.info/api/business-settings/brand_name \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "value": "iDrive Korea",
    "description": "Updated brand name"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Setting updated successfully",
  "setting": {
    "id": 1,
    "setting_key": "brand_name",
    "setting_value": "iDrive Korea",
    "updated_at": "2025-10-16T10:00:00.000Z"
  }
}
```

---

### PUT /api/business-settings/bulk
Update multiple business settings at once.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X PUT https://apicars.info/api/business-settings/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "settings": [
      { "key": "brand_name", "value": "iDrive Korea" },
      { "key": "contact_phone_1", "value": "048-660-691" },
      { "key": "contact_email", "value": "info@idrivekorea.com" }
    ]
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Updated 3 settings",
  "settings": [
    {
      "id": 1,
      "setting_key": "brand_name",
      "setting_value": "iDrive Korea"
    }
  ]
}
```

---

### POST /api/business-settings
Create a new business setting.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/business-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "setting_key": "new_setting",
    "setting_value": "value",
    "setting_type": "custom",
    "description": "A new custom setting"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Setting created successfully",
  "setting": {
    "id": 20,
    "setting_key": "new_setting",
    "setting_value": "value",
    "created_at": "2025-10-16T10:00:00.000Z"
  }
}
```

---

### DELETE /api/business-settings/:key
Deactivate a business setting.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X DELETE https://apicars.info/api/business-settings/old_setting \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response:**
```json
{
  "success": true,
  "message": "Setting deactivated successfully"
}
```

---

## 8. Reservations

All reservation endpoints are under `/api/reservations`.

### GET /api/reservations
Get all reservations with pagination.

**Request:**
```bash
curl "https://apicars.info/api/reservations?page=1&limit=50"
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 50 | Items per page (max: 100) |

**Success Response:**
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "comment": "Please contact me soon",
        "car_id": 123,
        "car_title": "2024 BMW X5 M Sport",
        "car_brand": "BMW",
        "car_model": "X5",
        "car_year": 2024,
        "car_price": 45000,
        "car_currency": "EUR",
        "car_images": ["https://..."],
        "exchange_car": false,
        "exchange_car_name": null,
        "exchange_car_details": null,
        "exchange_car_photos": [],
        "created_at": "2025-10-16T10:00:00.000Z",
        "car_missing": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### POST /api/reservations
Create a new car reservation.

**Request (Simple Reservation):**
```bash
curl -X POST https://apicars.info/api/reservations \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "email=john@example.com" \
  -F "phone=+1234567890" \
  -F "car={\"id\":\"123\"}" \
  -F "comment=Please contact me soon" \
  -F "exchangeCar=false" \
  -F "language=en"
```

**Request (With Exchange Car and Photos):**
```bash
curl -X POST https://apicars.info/api/reservations \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "email=john@example.com" \
  -F "phone=+1234567890" \
  -F "car={\"id\":\"123\"}" \
  -F "exchangeCar=true" \
  -F "exchangeCarName=2015 Toyota Camry" \
  -F "exchangeCarDetails=Good condition, 80k miles, all service records" \
  -F "exchangeCarPhotos=@/path/to/photo1.jpg" \
  -F "exchangeCarPhotos=@/path/to/photo2.jpg" \
  -F "exchangeCarPhotos=@/path/to/photo3.jpg" \
  -F "language=sq"
```

**Request Body (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | string | Yes | Customer first name |
| lastName | string | Yes | Customer last name |
| email | string | Yes | Customer email |
| phone | string | Yes | Customer phone number |
| car | string (JSON) | Yes | Car object with id field |
| comment | string | No | Additional comments |
| exchangeCar | string | No | "true" or "false" (default: "false") |
| exchangeCarName | string | No | Name/model of exchange car |
| exchangeCarDetails | string | No | Details about exchange car |
| exchangeCarPhotos | file[] | No | Photos of exchange car (max 10 files, 10MB each) |
| language | string | No | "en" or "sq" for email language (default: "en") |

**Success Response:**
```json
{
  "success": true
}
```

**Notes:**
- Emails are sent to both admin and customer
- Admin email includes all details and exchange car photos
- Customer email excludes sensitive information
- Supports both English and Albanian (sq) language
- Exchange car photos are embedded in email using CID attachments
- Reservation is saved to database even if email sending fails

---

## 9. File Uploads

All upload endpoints are under `/api/uploads`.

### POST /api/uploads/logo
Upload a new logo image.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/uploads/logo \
  -H "Authorization: Bearer eyJhbGc..." \
  -F "logo=@/path/to/logo.png"
```

**Accepted File Types:**
- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)
- SVG (.svg)

**Max File Size:** 5MB

**Success Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "filename": "logo_1697123456789.png",
    "url": "/static/uploads/logo_1697123456789.png",
    "size": 245678
  }
}
```

---

### POST /api/uploads/hero-background
Upload a new hero background image.

**Authentication Required:** Yes (Admin only)

**Request:**
```bash
curl -X POST https://apicars.info/api/uploads/hero-background \
  -H "Authorization: Bearer eyJhbGc..." \
  -F "heroBackground=@/path/to/background.jpg"
```

**Accepted File Types:**
- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)

**Max File Size:** 10MB

**Success Response:**
```json
{
  "success": true,
  "message": "Hero background uploaded successfully",
  "data": {
    "filename": "hero-background_1697123456789.jpg",
    "url": "/static/uploads/hero-background_1697123456789.jpg",
    "size": 1245678
  }
}
```

---

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

---

## Authentication

Most admin endpoints require JWT authentication. Include the access token in the Authorization header:

```bash
Authorization: Bearer <your-access-token>
```

### Getting an Access Token

1. Login using `/api/auth/login`
2. Extract the `accessToken` from the response
3. Include it in subsequent requests

**Example:**
```bash
# Login
TOKEN=$(curl -X POST https://apicars.info/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  | jq -r '.data.accessToken')

# Use token
curl https://apicars.info/api/cars/admin \
  -H "Authorization: Bearer $TOKEN"
```

### Token Expiration
- **Access Token:** 1 day
- **Refresh Token:** 7 days

Use the `/api/auth/refresh` endpoint to get a new access token when it expires.

---

## Error Handling

### HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid parameters or validation errors |
| 401 | Unauthorized | Invalid or missing authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Valid request but business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 502 | Bad Gateway | External API error |
| 503 | Service Unavailable | Database or service unavailable |

### Common Error Types

#### Validation Errors
```json
{
  "success": false,
  "message": "Invalid query parameters",
  "errors": [
    {
      "field": "yearFrom",
      "message": "Year must be between 1900 and 2026"
    },
    {
      "field": "limit",
      "message": "Limit must be between 1 and 100"
    }
  ]
}
```

#### Authentication Errors
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

```json
{
  "success": false,
  "message": "Token expired"
}
```

#### Database Errors
```json
{
  "success": false,
  "message": "Database connection failed",
  "error": "Connection timeout"
}
```

---

## Rate Limiting

### Current Limits (Production)
- **Public endpoints**: 1000 requests per minute
- **Scraping endpoints**: 10 requests per minute
- **Admin endpoints**: 1000 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1697123456
```

**Note:** Rate limiting is only active in production environment.

---

## Quick Start Examples

### Example 1: Get All Cars
```bash
curl "https://apicars.info/api/cars?limit=10"
```

### Example 2: Search BMW Cars from 2020
```bash
curl "https://apicars.info/api/cars?brand=BMW&yearFrom=2020&limit=20"
```

### Example 3: Login as Admin
```bash
curl -X POST https://apicars.info/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

### Example 4: Create a Reservation
```bash
curl -X POST https://apicars.info/api/reservations \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "email=john@example.com" \
  -F "phone=+1234567890" \
  -F "car={\"id\":\"123\"}"
```

### Example 5: Get Exchange Rates (Admin)
```bash
curl https://apicars.info/api/admin/exchange-rates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 6: Start TrioVetura Scraping (Admin)
```bash
curl -X POST https://apicars.info/api/triovetura/start-scraping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "maxPages": 10,
    "perPage": 100
  }'
```

### Example 7: Calculate Car Pricing
```bash
curl -X POST https://apicars.info/api/cars/pricing-breakdown \
  -H "Content-Type: application/json" \
  -d '{
    "originalPrice": 13290000,
    "bodyType": "SUV",
    "isKrw": true
  }'
```

### Example 8: Get Public Business Settings
```bash
curl https://apicars.info/api/business-settings/public
```

---

## Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (never in localStorage for sensitive apps)
3. **Refresh tokens before they expire**
4. **Handle rate limiting gracefully**
5. **Validate input on client side** before sending to API
6. **Use pagination** for large datasets
7. **Cache public endpoints** when appropriate
8. **Log errors** for debugging
9. **Use appropriate HTTP methods** (GET, POST, PUT, DELETE)
10. **Include proper error handling** in your application

---

## Support

For issues or questions:
- Email: support@idrivekorea.com
- GitHub: [Repository Issues](https://github.com/your-repo/issues)

---

## Changelog

### Version 1.0.0 (2025-10-16)
- Initial API documentation
- Complete endpoint coverage
- Authentication system
- Business settings management
- Reservation system
- TrioVetura integration
- Admin panel

---

**Last Updated:** October 16, 2025
**API Version:** 1.0.0

