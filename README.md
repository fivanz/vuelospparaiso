# Panel de Control de Vuelos Paraíso

Dashboard en tiempo real para el monitoreo de vuelos de parapente, diseñado para ser mostrado en pantalla TV.

## Características

- **Visualización en Mapa**: Muestra posiciones de vuelo en tiempo real con marcadores tipo GPS en un mapa satelital
- **Panel de Estado de Vuelos**: Muestra información de vuelos en formato similar a pantallas de aerolíneas
- **Integración Webhook**: Recibe actualizaciones en tiempo real de posición y estado de vuelos
- **Autenticación**: Usa API Key para proteger los endpoints de webhook

## Webhooks Autenticados

La aplicación expone dos endpoints webhook protegidos con API Key:

1. **Actualizaciones de Posición**: `https://vuelospparaiso.tecndev.com/api/webhook/position`
2. **Actualizaciones de Estado de Vuelo**: `https://vuelospparaiso.tecndev.com/api/webhook/flight`

### Autenticación

Todos los webhooks requieren una clave API que debe enviarse en el encabezado HTTP `X-API-Key`. Por ejemplo:

```
X-API-Key: vuelos_paraiso_api_key_2025
```

> **IMPORTANTE**: Cambie la clave API predeterminada por una segura después de implementar la aplicación.

### Formato de Actualización de Posición

```json
{
  "id": "vuelo-123",
  "latitude": 4.6097,
  "longitude": -74.0817,
  "altitude": 2800
}
```

### Formato de Actualización de Estado de Vuelo

```json
{
  "id": "vuelo-123",
  "pilot_name": "Juan Perez",
  "passenger_name": "Maria Lopez",
  "status": "flying",
  "scheduled_departure": "2025-03-15T10:30:00Z",
  "estimated_takeoff": "2025-03-15T10:35:00Z"
}
```

Los estados de vuelo pueden ser: `scheduled` (programado), `flying` (volando), `paused` (pausado), `landed` (aterrizó)

## Detalles Técnicos

- Frontend: React con Leaflet para mapas
- Backend: FastAPI
- Almacenamiento de Datos: En memoria (sin persistencia)

## Notas de Implementación

### Integración Webhook

Al implementar en vuelospparaiso.tecndev.com, configure sus sistemas para enviar solicitudes webhook a:

- Actualizaciones de posición: POST a `https://vuelospparaiso.tecndev.com/api/webhook/position`
- Actualizaciones de estado de vuelo: POST a `https://vuelospparaiso.tecndev.com/api/webhook/flight`

Asegúrese de que cada vuelo tenga un ID único que se use de manera consistente entre las actualizaciones de posición y estado.

### Comandos cURL de Ejemplo para Pruebas

```bash
# Actualizar estado de vuelo
curl -X POST "https://vuelospparaiso.tecndev.com/api/webhook/flight" \
-H "Content-Type: application/json" \
-H "X-API-Key: vuelos_paraiso_api_key_2025" \
-d '{
  "id": "vuelo-123",
  "pilot_name": "Juan Perez",
  "passenger_name": "Maria Lopez",
  "status": "flying",
  "scheduled_departure": "2025-03-15T10:30:00Z",
  "estimated_takeoff": "2025-03-15T10:35:00Z"
}'

# Actualizar posición
curl -X POST "https://vuelospparaiso.tecndev.com/api/webhook/position" \
-H "Content-Type: application/json" \
-H "X-API-Key: vuelos_paraiso_api_key_2025" \
-d '{
  "id": "vuelo-123",
  "latitude": 4.6097,
  "longitude": -74.0817,
  "altitude": 2800
}'
```

### Recomendaciones para Pantalla TV

- El dashboard está diseñado para ser mostrado en un TV o monitor grande
- Resolución recomendada: 1920x1080 (Full HD) o superior
- Use un navegador en modo pantalla completa (F11 en la mayoría de navegadores)

## Guía de Configuración

### Cambiar la API Key

Para cambiar la API Key por razones de seguridad:

1. Edite el archivo `.env` en el directorio `/app/backend/`
2. Cambie el valor de `API_KEY` a una cadena segura y aleatoria
3. Reinicie el servicio backend

### Personalización

Para personalizar el Panel de Control:

1. **Título**: Para cambiar el título, edite la línea con `flight-list-title` en `/app/frontend/src/App.js`
2. **Colores**: Los colores de los estados se pueden ajustar en las variables `statusColors` en `/app/frontend/src/App.js`
3. **Posición inicial del mapa**: Ajuste las coordenadas en la función `setView` donde inicializa el mapa para centrarlo en su área de operación

## Desarrollo Adicional

### Extensiones Posibles

- Añadir historial de vuelos
- Implementar autenticación en el panel de visualización
- Agregar métricas de vuelo adicionales como velocidad, dirección, etc.
- Añadir notificaciones para cambios de estado

### Seguridad

- La API Key predeterminada debe cambiarse antes de implementar en producción
- Considere implementar HTTPS para proteger la comunicación
- Se recomienda limitar el acceso a los webhooks por IP si es posible
