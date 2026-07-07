import { GeoJSON, MapContainer, TileLayer, Marker, Polyline, Polygon, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { DaycareRegisterResponse } from "../../daycares/interfaces/Daycare.interface";
import "leaflet/dist/leaflet.css";

type SigMapProps = {
  selectedDaycare: DaycareRegisterResponse | null;
  isDrawing: boolean;
  drawnPoints: L.LatLng[];
  onMapClick: (latlng: L.LatLng) => void;
};

// Helper component to handle centering and zooming dynamically
function ChangeMapView({ bounds }: { bounds?: L.LatLngBounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    } else {
      // Default to Santa Cruz city center if no polygon is configured
      map.setView([-17.7833, -63.1821], 15);
    }
  }, [bounds, map]);

  return null;
}

// Helper component to capture map clicks during drawing mode
function MapEvents({ onMapClick, isDrawing }: { onMapClick: (latlng: L.LatLng) => void; isDrawing: boolean }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// Custom Marker DivIcon to display numbered points beautifully
const numberIcon = (index: number) => L.divIcon({
  className: "custom-div-icon",
  html: `<div class="w-6 h-6 rounded-full bg-slate-950 text-white border-2 border-white shadow-md flex items-center justify-center text-[10px] font-black hover:scale-110 transition-transform">
           ${index + 1}
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function SigMap({
  selectedDaycare,
  isDrawing,
  drawnPoints,
  onMapClick,
}: SigMapProps) {

  // Calculate bounds if selected daycare has an existing area polygon
  let bounds: L.LatLngBounds | undefined;
  let geojsonFeature: any = null;

  if (selectedDaycare?.area && selectedDaycare.has_area) {
    try {
      geojsonFeature = {
        type: "Feature",
        properties: { name: selectedDaycare.name },
        geometry: selectedDaycare.area,
      };
      const geojsonLayer = L.geoJSON(selectedDaycare.area as any);
      bounds = geojsonLayer.getBounds();
    } catch (e) {
      console.error("Error calculating daycare area bounds:", e);
    }
  }

  return (
    <div className="h-[600px] overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm relative">
      <MapContainer
        center={[-17.7833, -63.1821]}
        zoom={15}
        scrollWheelZoom
        className="h-full w-full z-10"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamically fly to daycare position */}
        <ChangeMapView bounds={bounds} />

        {/* Capture click events for drawing */}
        <MapEvents onMapClick={onMapClick} isDrawing={isDrawing} />

        {/* Render existing daycare area polygon */}
        {!isDrawing && geojsonFeature && (
          <GeoJSON
            key={JSON.stringify(geojsonFeature)}
            data={geojsonFeature}
            style={{
              color: "#0891b2",
              weight: 3,
              fillColor: "#10b981",
              fillOpacity: 0.2,
            }}
          />
        )}

        {/* Render drawing layer */}
        {isDrawing && (
          <>
            {/* Draw markers on every click point */}
            {drawnPoints.map((point, index) => (
              <Marker
                key={`point-${index}-${point.lat}-${point.lng}`}
                position={point}
                icon={numberIcon(index)}
              />
            ))}

            {/* Draw polyline connection */}
            {drawnPoints.length >= 2 && (
              <Polyline
                positions={drawnPoints}
                pathOptions={{ color: "#0891b2", weight: 3, dashArray: "5, 8" }}
              />
            )}

            {/* Draw filled preview polygon starting from 3 points */}
            {drawnPoints.length >= 3 && (
              <Polygon
                positions={drawnPoints}
                pathOptions={{
                  color: "#0891b2",
                  weight: 3,
                  fillColor: "#10b981",
                  fillOpacity: 0.25,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}