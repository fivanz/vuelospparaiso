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
  scheduled: "bg-blue-200 border-blue-500",
  paused: "bg-yellow-200 border-yellow-500",
  flying: "bg-green-200 border-green-500",
  landed: "bg-gray-200 border-gray-500"
};

// Marker icons for different flight statuses
const createMarkerIcon = (status) => {
  const color = {
    scheduled: "#3b82f6", // blue
    paused: "#eab308",    // yellow
    flying: "#22c55e",    // green
    landed: "#6b7280"     // gray
  }[status] || "#ef4444"; // default red

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

function App() {
  // State for flight data
  const [flights, setFlights] = useState([]);
  const [positions, setPositions] = useState([]);
  const [markers, setMarkers] = useState({});
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      // Initialize Leaflet map
      mapInstanceRef.current = L.map(mapRef.current).setView([4.6097, -74.0817], 13); // Default to Bogotá, Colombia
      
      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
      const markerIcon = createMarkerIcon(status);
      
      const popupContent = `
        <div class="font-bold">${flight ? `${flight.pilot_name} with ${flight.passenger_name}` : 'Unknown Flight'}</div>
        <div>Status: ${flight ? flight.status : 'unknown'}</div>
        <div>Altitude: ${position.altitude}m</div>
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
  }, [positions, flights]);

  // Poll for data updates every 5 seconds
  useEffect(() => {
    fetchData(); // Initial fetch
    
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="App">
      <div className="dashboard-container">
        {/* Left Panel - Map */}
        <div className="map-container" ref={mapRef}></div>
        
        {/* Right Panel - Flight List */}
        <div className="flight-list">
          <h1 className="flight-list-title">Flight Control</h1>
          
          <div className="flight-cards">
            {flights.map(flight => (
              <div 
                key={flight.id} 
                className={`flight-card ${statusColors[flight.status]}`}
              >
                <div className="flight-header">
                  <span className="flight-id">ID: {flight.id.substring(0, 8)}</span>
                  <span className={`flight-status status-${flight.status}`}>
                    {flight.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flight-details">
                  <div><span className="label">Pilot:</span> {flight.pilot_name}</div>
                  <div><span className="label">Passenger:</span> {flight.passenger_name}</div>
                  {flight.scheduled_departure && (
                    <div>
                      <span className="label">Departure:</span> 
                      {new Date(flight.scheduled_departure).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {flights.length === 0 && (
              <div className="no-flights-message">
                No flights available. Awaiting data...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
