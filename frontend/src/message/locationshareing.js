import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Header from "../header";

const socket = io("http://localhost:8000");

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LocationSearchPicker = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const chatroomId = location.state?.chatroom;
  const userId = location.state?.sender || sessionStorage.getItem("userId");

  const searchLocation = async () => {
    if (!query) return;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&limit=10`
    );
    const data = await res.json();
    setResults(data);
  };
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) searchLocation();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (place) => {
    const coords = [parseFloat(place.lat), parseFloat(place.lon)];
    setSelected({
      name: place.display_name,
      coordinates: coords,
      mapUrl: `https://maps.google.com?q=${coords[0]},${coords[1]}`,
    });
    setResults([]);
  };

  const sendLocation = () => {
    if (selected && chatroomId && userId) {
      socket.emit("sendMessage", {
        chatroom: chatroomId,
        sender: userId,
        type: "location",
        location: {
          type: "Point",
          coordinates: [selected.coordinates[1], selected.coordinates[0]],
          name: selected.name,
          mapUrl: selected.mapUrl,
        },
      });
    }
    navigate(-1);
  };

  return (
    <>
      <Header />
      <div className="chat-container">
        <div className="chat-header">Search Location</div>
        <div className="chat-messages">
          <input
            type="text"
            placeholder="Search location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchLocation()}
          />
          <button onClick={searchLocation}>🔍 Search</button>
          {results.length === 0 && query && (
            <div>No locations found for "{query}"</div>
          )}
          {results.length > 0 && (
            <ul>
              {results.map((r, i) => (
                <div key={i} onClick={() => handleSelect(r)}>
                  {r.display_name}
                </div>
              ))}
            </ul>
          )}

          {selected && (
            <>
              <div className="map-wrapper">
                <MapContainer
                  center={selected.coordinates}
                  zoom={15}
                  className="leaflet-map"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <Marker position={selected.coordinates}>
                    <Popup>{selected.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <button onClick={sendLocation} className="send-button">
                📍 Send Location
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LocationSearchPicker;
