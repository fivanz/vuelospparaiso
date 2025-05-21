import { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Backend API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Flight status colors
const statusColors = {
  scheduled: {
    bg: "bg-blue-200",
    border: "border-blue-500",
    color: "#3b82f6" // blue
  },
  paused: {
    bg: "bg-yellow-200",
    border: "border-yellow-500",
    color: "#eab308" // yellow
  },
  flying: {
    bg: "bg-green-200",
    border: "border-green-500",
    color: "#22c55e" // green
  },
  landed: {
    bg: "bg-gray-200",
    border: "border-gray-500",
    color: "#6b7280" // gray
  }
};

// Create numbered GPS marker icons for different flight statuses
const createMarkerIcon = (status, flightNumber) => {
  const color = statusColors[status]?.color || "#ef4444"; // default red

  // Create SVG icon for GPS marker with the status color and flight number
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="marker-pin" style="background-color: ${color};">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
          <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" />
        </svg>
        <div class="marker-number">${flightNumber}</div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40]
  });
};

// Format date for display
const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Translate status to Spanish
const translateStatus = (status) => {
  return status === 'scheduled' ? 'PROGRAMADO' : 
         status === 'flying' ? 'VOLANDO' : 
         status === 'paused' ? 'PAUSADO' : 
         status === 'landed' ? 'ATERRIZÓ' : 
         status.toUpperCase();
};

function App() {
  // State for flight data
  const [flights, setFlights] = useState([]);
  const [positions, setPositions] = useState([]);
  const [markers, setMarkers] = useState({});
  const [flightNumbers, setFlightNumbers] = useState({});
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Assign sequential numbers to flights for easier identification
  useEffect(() => {
    const activeFlights = flights.filter(f => f.status !== 'landed');
    const newFlightNumbers = {};
    
    activeFlights.forEach((flight, index) => {
      newFlightNumbers[flight.id] = index + 1;
    });
    
    setFlightNumbers(newFlightNumbers);
  }, [flights]);

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      // Initialize Leaflet map
      mapInstanceRef.current = L.map(mapRef.current).setView([4.6097, -74.0817], 13); // Default to Bogotá, Colombia
      
      // Add satellite tile layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Imagery &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
      
      // Add labels on top of satellite imagery
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }
  }, []);

  // Fetch flights and positions data
  const fetchData = async () => {
    try {
      const [flightsResponse, positionsResponse] = await Promise.all([
        axios.get(`${API}/flights`),
        axios.get(`${API}/positions`)
      ]);
      
      setFlights(flightsResponse.data);
      setPositions(positionsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Update map markers when positions change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Update existing markers and add new ones
    const updatedMarkers = { ...markers };

    positions.forEach(position => {
      // Find the associated flight to determine status
      const flight = flights.find(f => f.id === position.id);
      const status = flight ? flight.status : 'unknown';
      const flightNumber = flightNumbers[position.id] || '?';
      const markerIcon = createMarkerIcon(status, flightNumber);
      
      const popupContent = `
        <div class="marker-popup">
          <div class="popup-number">#${flightNumber}</div>
          <div class="popup-title">${flight ? `${flight.pilot_name} con ${flight.passenger_name}` : 'Vuelo Desconocido'}</div>
          <div class="popup-status">Estado: ${flight ? translateStatus(flight.status) : 'desconocido'}</div>
          <div class="popup-altitude">Altitud: ${position.altitude}m</div>
          ${flight && flight.scheduled_departure ? `<div class="popup-time">Programado: ${formatDateTime(flight.scheduled_departure)}</div>` : ''}
        </div>
      `;

      if (updatedMarkers[position.id]) {
        // Update existing marker
        updatedMarkers[position.id].setLatLng([position.latitude, position.longitude]);
        updatedMarkers[position.id].setIcon(markerIcon);
        updatedMarkers[position.id].getPopup().setContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker([position.latitude, position.longitude], { icon: markerIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent);
        
        updatedMarkers[position.id] = marker;
      }
    });

    setMarkers(updatedMarkers);
  }, [positions, flights, flightNumbers]);

  // Poll for data updates every 5 seconds
  useEffect(() => {
    fetchData(); // Initial fetch
    
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Filter flights for the upcoming flights list (only scheduled flights)
  const upcomingFlights = flights
    .filter(flight => flight.status === 'scheduled')
    .sort((a, b) => {
      if (!a.scheduled_departure) return 1;
      if (!b.scheduled_departure) return -1;
      return new Date(a.scheduled_departure) - new Date(b.scheduled_departure);
    });

  // Active flights (not landed) for the main list
  const activeFlights = flights
    .filter(flight => flight.status !== 'landed')
    .sort((a, b) => {
      // First by status priority: flying, paused, scheduled
      const statusPriority = { flying: 0, paused: 1, scheduled: 2 };
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by scheduled time
      if (!a.scheduled_departure) return 1;
      if (!b.scheduled_departure) return -1;
      return new Date(a.scheduled_departure) - new Date(b.scheduled_departure);
    });

  return (
    <div className="App">
      <div className="dashboard-container">
        {/* Left Panel - Map */}
        <div className="map-container" ref={mapRef}></div>
        
        {/* Right Panel - Flight List */}
        <div className="flight-list">
          <h1 className="flight-list-title">Vuelos Paraíso</h1>
          
          <div className="flight-cards">
            {activeFlights.map(flight => (
              <div 
                key={flight.id} 
                className={`flight-card ${statusColors[flight.status]?.bg} ${statusColors[flight.status]?.border}`}
              >
                <div className="flight-header">
                  <span className="flight-number">#{flightNumbers[flight.id] || '?'}</span>
                  <span className={`flight-status status-${flight.status}`}>
                    {translateStatus(flight.status)}
                  </span>
                </div>
                
                <div className="flight-details">
                  <div><span className="label">Piloto:</span> {flight.pilot_name}</div>
                  <div><span className="label">Pasajero:</span> {flight.passenger_name}</div>
                  
                  {flight.scheduled_departure && (
                    <div>
                      <span className="label">Programado:</span> 
                      {formatDateTime(flight.scheduled_departure)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {activeFlights.length === 0 && (
              <div className="no-flights-message">
                No hay vuelos activos. Esperando datos...
              </div>
            )}
          </div>
          
          {/* Upcoming Flights List */}
          {upcomingFlights.length > 0 && (
            <div className="upcoming-flights">
              <h2 className="upcoming-title">PRÓXIMOS VUELOS - PREPARARSE</h2>
              <div className="upcoming-list">
                {upcomingFlights.map((flight, index) => (
                  <div key={flight.id} className="upcoming-item">
                    <span className="upcoming-number">#{flightNumbers[flight.id] || '?'}</span>
                    <span className="upcoming-names">
                      {flight.passenger_name} con {flight.pilot_name}
                    </span>
                    <span className="upcoming-time">
                      {formatDateTime(flight.scheduled_departure)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
