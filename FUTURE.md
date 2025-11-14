## Future Enhancements

- Rate limiting on bot API
- Health check endpoints
- Metrics/monitoring
- Multi-guild support
- Queue management endpoints (GET, DELETE)
- Admin API for bot management

## Environment

- Redis is required for queue sync. Configure `REDIS_URL` (and optional `REDIS_USERNAME`, `REDIS_PASSWORD`) for both the bot and API binaries.
