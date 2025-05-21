# Guía de Integración de Webhooks para Vuelos Paraíso

Este documento proporciona instrucciones detalladas sobre cómo integrar sus sistemas con el Panel de Control de Vuelos Paraíso.

## Descripción General

El sistema de Vuelos Paraíso utiliza webhooks para recibir datos en tiempo real sobre:

1. **Posiciones de vuelo**: Coordenadas geográficas de los parapentes durante el vuelo
2. **Estados de vuelo**: Información sobre el estado del vuelo, piloto, pasajero y horarios

## Autenticación

Todos los webhooks están protegidos por autenticación API Key. Para cada solicitud, debe incluir el encabezado:

```
X-API-Key: vuelos_paraiso_api_key_2025
```

> **Nota de seguridad**: Esta es la clave predeterminada. Para un entorno de producción, debe cambiarla a un valor seguro y secreto.

## Endpoints de Webhook

### 1. Actualización de Posición

**URL**: `https://vuelospparaiso.tecndev.com/api/webhook/position`  
**Método**: POST  
**Encabezados requeridos**:
- `Content-Type: application/json`
- `X-API-Key: vuelos_paraiso_api_key_2025`

**Cuerpo de la solicitud**:
```json
{
  "id": "string",         // Identificador único del vuelo (obligatorio)
  "latitude": number,     // Latitud en grados decimales (obligatorio)
  "longitude": number,    // Longitud en grados decimales (obligatorio)
  "altitude": number      // Altitud en metros (obligatorio)
}
```

**Respuesta exitosa**:
```json
{
  "status": "success",
  "message": "Position updated for ID: <flight-id>"
}
```

### 2. Actualización de Estado de Vuelo

**URL**: `https://vuelospparaiso.tecndev.com/api/webhook/flight`  
**Método**: POST  
**Encabezados requeridos**:
- `Content-Type: application/json`
- `X-API-Key: vuelos_paraiso_api_key_2025`

**Cuerpo de la solicitud**:
```json
{
  "id": "string",                   // Identificador único del vuelo (obligatorio)
  "pilot_name": "string",           // Nombre del piloto (obligatorio)
  "passenger_name": "string",       // Nombre del pasajero (obligatorio)
  "status": "string",               // Estado: "scheduled", "flying", "paused", "landed" (obligatorio)
  "scheduled_departure": "string",  // Hora programada de salida en formato ISO (opcional)
  "estimated_takeoff": "string"     // Hora estimada de despegue en formato ISO (opcional)
}
```

**Respuesta exitosa**:
```json
{
  "status": "success",
  "message": "Flight status updated for ID: <flight-id>"
}
```

## Consideraciones Importantes

### 1. Coherencia de ID de Vuelos

- El `id` del vuelo debe ser el mismo entre las actualizaciones de posición y estado
- Esto permite que el sistema correlacione la información correctamente

### 2. Formato de Fechas y Horas

- Todas las fechas y horas deben estar en formato ISO 8601: `YYYY-MM-DDTHH:MM:SSZ`
- Ejemplo: `2025-03-15T10:30:00Z`
- Se recomienda usar UTC para evitar problemas con zonas horarias

### 3. Estados de Vuelo

Los estados válidos para el campo `status` son:

- `scheduled`: Vuelo programado, aún no ha despegado
- `flying`: Vuelo en progreso, parapente en el aire
- `paused`: Vuelo temporalmente en pausa o en espera
- `landed`: Vuelo completado, parapente ha aterrizando

### 4. Frecuencia de Actualización

- Para posiciones: Se recomienda enviar actualizaciones cada 1-5 segundos
- Para estados de vuelo: Enviar actualizaciones cuando cambie el estado

### 5. Manejo de Errores

Si el servidor responde con un error (código 4xx o 5xx), su sistema debería:

1. Registrar el error
2. Esperar un breve período (backoff exponencial recomendado)
3. Reintentar el envío

## Ejemplos de Integración

### Python

```python
import requests
import json

API_URL = "https://vuelospparaiso.tecndev.com/api/webhook"
API_KEY = "vuelos_paraiso_api_key_2025"

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

# Actualizar posición
def update_position(flight_id, lat, lon, alt):
    data = {
        "id": flight_id,
        "latitude": lat,
        "longitude": lon,
        "altitude": alt
    }
    
    response = requests.post(
        f"{API_URL}/position",
        headers=headers,
        data=json.dumps(data)
    )
    
    return response.json()

# Actualizar estado de vuelo
def update_flight_status(flight_id, pilot, passenger, status, scheduled=None, takeoff=None):
    data = {
        "id": flight_id,
        "pilot_name": pilot,
        "passenger_name": passenger,
        "status": status
    }
    
    if scheduled:
        data["scheduled_departure"] = scheduled
        
    if takeoff:
        data["estimated_takeoff"] = takeoff
    
    response = requests.post(
        f"{API_URL}/flight",
        headers=headers,
        data=json.dumps(data)
    )
    
    return response.json()
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'https://vuelospparaiso.tecndev.com/api/webhook';
const API_KEY = 'vuelos_paraiso_api_key_2025';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
};

// Actualizar posición
async function updatePosition(flightId, lat, lon, alt) {
  const data = {
    id: flightId,
    latitude: lat,
    longitude: lon,
    altitude: alt
  };
  
  try {
    const response = await axios.post(
      `${API_URL}/position`,
      data,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating position:', error.response?.data || error.message);
    throw error;
  }
}

// Actualizar estado de vuelo
async function updateFlightStatus(flightId, pilot, passenger, status, scheduled = null, takeoff = null) {
  const data = {
    id: flightId,
    pilot_name: pilot,
    passenger_name: passenger,
    status: status
  };
  
  if (scheduled) {
    data.scheduled_departure = scheduled;
  }
  
  if (takeoff) {
    data.estimated_takeoff = takeoff;
  }
  
  try {
    const response = await axios.post(
      `${API_URL}/flight`,
      data,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating flight status:', error.response?.data || error.message);
    throw error;
  }
}
```

## Solución de Problemas

### Errores Comunes

| Código | Descripción | Solución |
|--------|-------------|----------|
| 403 | "Invalid or missing API Key" | Verifique que está enviando el encabezado X-API-Key con el valor correcto |
| 422 | Error de validación | Verifique el formato de su JSON y asegúrese de que todos los campos requeridos estén presentes |
| 500 | Error interno del servidor | Contacte al administrador del sistema con los detalles del error |

### Contacto para Soporte

Si encuentra problemas con la integración, por favor contacte al soporte técnico de Vuelos Paraíso.
