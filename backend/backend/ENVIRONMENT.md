# Smart Home Energy Monitor - Environment Configuration Guide

## Environment Variables Setup

This guide explains how to configure environment variables for the Smart Home Energy Monitor application.

## Quick Start

1. **Copy the environment template:**

   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Configure your MongoDB connection:**

   ```bash
   MONGO_URI=mongodb://localhost:27017/smart-home-energy
   ```

3. **Set your environment:**
   ```bash
   NODE_ENV=development
   ```

## Required Variables

### Database Configuration

- `MONGO_URI` - MongoDB connection string (required)
- `NODE_ENV` - Application environment (development/production/test)

### Application Settings

- `PORT` - Server port (default: 3000)
- `API_PREFIX` - API version prefix (default: api/v1)

## Optional Variables

### Rate Limiting

- `THROTTLE_SHORT_TTL` - Short-term rate limit TTL (default: 1000ms)
- `THROTTLE_SHORT_LIMIT` - Short-term rate limit count (default: 10)
- `THROTTLE_MEDIUM_TTL` - Medium-term rate limit TTL (default: 10000ms)
- `THROTTLE_MEDIUM_LIMIT` - Medium-term rate limit count (default: 50)
- `THROTTLE_LONG_TTL` - Long-term rate limit TTL (default: 60000ms)
- `THROTTLE_LONG_LIMIT` - Long-term rate limit count (default: 200)

### Telemetry Settings

- `DEFAULT_RETENTION_DAYS` - Data retention period (default: 30)
- `MAX_BATCH_SIZE` - Maximum batch size (default: 1000)
- `DEFAULT_READING_LIMIT` - Default reading limit (default: 100)
- `DEFAULT_STATS_HOURS` - Default stats period (default: 24)

### CORS Configuration

- `CORS_ORIGINS` - Allowed origins (comma-separated)
- `CORS_CREDENTIALS` - Enable credentials (default: true)

## Environment Examples

### Local Development

```bash
MONGO_URI=mongodb://localhost:27017/smart-home-energy-dev
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:3000,http://localhost:4200
```

### Docker Compose

```bash
MONGO_URI=mongodb://mongo:27017/smart-home-energy
NODE_ENV=development
PORT=3000
```

### Production

```bash
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/smart-home-energy
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
CORS_ORIGINS=https://yourdomain.com
TRUST_PROXY=true
```

### Testing

```bash
MONGO_URI=mongodb://localhost:27017/smart-home-energy-test
NODE_ENV=test
PORT=3001
LOG_LEVEL=error
```

## MongoDB Connection Examples

### Local MongoDB

```bash
MONGO_URI=mongodb://localhost:27017/smart-home-energy
```

### MongoDB with Authentication

```bash
MONGO_URI=mongodb://username:password@localhost:27017/smart-home-energy
```

### MongoDB Atlas (Cloud)

```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-home-energy
```

### MongoDB Replica Set

```bash
MONGO_URI=mongodb://host1:27017,host2:27017,host3:27017/smart-home-energy?replicaSet=rs0
```

## Security Considerations

### Production Environment

- Use strong passwords for MongoDB
- Enable SSL/TLS for database connections
- Set appropriate CORS origins
- Use environment-specific secrets
- Enable request logging for monitoring

### Development Environment

- Use local MongoDB instance
- Enable debug logging
- Allow localhost CORS origins
- Use development-specific database names

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if MongoDB is running
   - Verify connection string format
   - Check network connectivity

2. **Authentication Failed**
   - Verify username/password
   - Check database permissions
   - Ensure user exists in MongoDB

3. **CORS Errors**
   - Add frontend URL to CORS_ORIGINS
   - Check protocol (http vs https)
   - Verify port numbers

4. **Rate Limiting Issues**
   - Adjust throttle limits for development
   - Check if limits are too restrictive
   - Monitor request patterns

## Validation

The application validates environment variables on startup. Check the console output for any configuration warnings or errors.

## Support

For environment configuration issues:

1. Check the application logs
2. Verify MongoDB connectivity
3. Review environment variable format
4. Consult the main README.md for setup instructions
