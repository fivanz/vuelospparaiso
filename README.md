# Flight Control Dashboard for Paragliding

A real-time monitoring dashboard for paragliding flights, designed to be displayed on a TV screen.

## Features

- **Map Display**: Shows real-time flight positions with GPS-style markers on a satellite map
- **Flight Status Board**: Displays flight information in an airline-style format
- **Webhook Integration**: Receives real-time position and flight status updates

## Webhooks

The application exposes two webhook endpoints:

1. **Position Updates**: `https://vuelospparaiso.tecndev.com/api/webhook/position`
2. **Flight Status Updates**: `https://vuelospparaiso.tecndev.com/api/webhook/flight`

### Position Update Format

```json
{
  "id": "flight-id",
  "latitude": 4.6097,
  "longitude": -74.0817,
  "altitude": 2800
}
```

### Flight Status Update Format

```json
{
  "id": "flight-id",
  "pilot_name": "Juan Perez",
  "passenger_name": "Maria Lopez",
  "status": "flying",
  "scheduled_departure": "2025-03-15T10:30:00Z"
}
```

Flight status can be one of: `scheduled`, `flying`, `paused`, `landed`

## Technical Details

- Frontend: React with Leaflet for maps
- Backend: FastAPI
- Data Storage: In-memory (no persistence)

## Implementation Notes

### Webhook Integration

When deploying to vuelospparaiso.tecndev.com, configure your systems to send webhook requests to:

- Position updates: POST to `https://vuelospparaiso.tecndev.com/api/webhook/position`
- Flight status updates: POST to `https://vuelospparaiso.tecndev.com/api/webhook/flight`

Make sure each flight has a unique ID that is used consistently between position and status updates.

### Example cURL Commands for Testing

```bash
# Update flight status
curl -X POST "https://vuelospparaiso.tecndev.com/api/webhook/flight" \
-H "Content-Type: application/json" \
-d '{
  "id": "vuelo-123",
  "pilot_name": "Juan Perez",
  "passenger_name": "Maria Lopez",
  "status": "flying",
  "scheduled_departure": "2025-03-15T10:30:00Z"
}'

# Update position
curl -X POST "https://vuelospparaiso.tecndev.com/api/webhook/position" \
-H "Content-Type: application/json" \
-d '{
  "id": "vuelo-123",
  "latitude": 4.6097,
  "longitude": -74.0817,
  "altitude": 2800
}'
```

### TV Display Recommendations

- The dashboard is designed to be displayed on a TV or large monitor
- Recommended resolution: 1920x1080 (Full HD) or higher
- Use a browser in full-screen mode (F11 in most browsers)
