import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

const PlacesMap = () => {
  const [places, setPlaces] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();

  const defaultIcon = new L.Icon({
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  useEffect(() => {
    setTimeout(() => setMapReady(true), 1000);
    fetchPlaces();
  }, [token]);

  const fetchPlaces = async () => {
    try {
      const res = await fetch("http://localhost:8000/postdata", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setPlaces(data.post);

      for (const place of data.post) {
        const coords = await getCoordinatesWithRetry(
          place.title,
          place.country
        );
        if (coords) {
          setMarkers((prevMarkers) => [
            ...prevMarkers,
            { ...place, lat: coords.lat, lon: coords.lon },
          ]);
        }
      }
    } catch (error) {
      console.error(" Error fetching places:", error);
    }
  };

  const getCoordinatesWithRetry = async (title, country, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const coords = await getCoordinates(title, country);
      if (coords) return coords;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.error(` Failed to fetch coordinates for ${title}`);
    return null;
  };

  const getCoordinates = async (title, country) => {
    const placeQuery = encodeURIComponent(`${title}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${placeQuery}&limit=1`;

    try {
      const response = await axios.get(url);
      if (response.data.length > 0) {
        return {
          lat: parseFloat(response.data[0].lat),
          lon: parseFloat(response.data[0].lon),
        };
      }
    } catch (error) {
      console.error(` Error fetching coordinates for ${title}:`, error);
    }
    return null;
  };

  return (
    <div className="list-wrapper">
      {mapReady && (
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={false}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <SetMapBounds markers={markers} />
          {markers.map((place, index) => (
            <Marker
              key={index}
              position={[place.lat, place.lon]}
              icon={defaultIcon}
            >
              <Popup>
                <strong
                  className="link"
                  onClick={() => navigate(`/${place._id}/detail`)}
                >
                  <strong>{place.title}</strong>
                  <br />
                  {place.country}
                </strong>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};
const SetMapBounds = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
};

export default PlacesMap;
