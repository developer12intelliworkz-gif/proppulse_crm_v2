import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadGoogleMapsScript, getGoogleMapsApiKey } from "@/utils/googleMapsLoader";

type LatLng = { lat: number; lng: number };

interface GoogleMapLocationPickerProps {
  searchValue: string;
  latitude: string;
  longitude: string;
  onSearchChange: (value: string) => void;
  onCoordinatesChange: (lat: string, lng: string) => void;
  disabled?: boolean;
}

const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 };

const GoogleMapLocationPicker = ({
  searchValue,
  latitude,
  longitude,
  onSearchChange,
  onCoordinatesChange,
  disabled = false,
}: GoogleMapLocationPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Google Maps types are loaded at runtime via script tag
  const mapRef = useRef<{ panTo: (pos: LatLng) => void } | null>(null);
  const markerRef = useRef<{
    setPosition: (pos: LatLng) => void;
    getPosition: () => { lat: () => number; lng: () => number } | undefined;
    addListener: (event: string, cb: () => void) => void;
  } | null>(null);
  const autocompleteRef = useRef<{
    getPlace: () => {
      formatted_address?: string;
      name?: string;
      geometry?: { location: { lat: () => number; lng: () => number } };
    };
    addListener: (event: string, cb: () => void) => void;
  } | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const apiKey = getGoogleMapsApiKey();

  const setMarkerPosition = useCallback(
    (lat: number, lng: number, pan = true) => {
      if (!mapRef.current) return;
      const position: LatLng = { lat, lng };
      const g = (window as Window & { google: any }).google;
      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else if (mapRef.current) {
        markerRef.current = new g.maps.Marker({
          position,
          map: mapRef.current,
          draggable: !disabled,
        });
        markerRef.current.addListener("dragend", () => {
          const pos = markerRef.current?.getPosition();
          if (!pos) return;
          onCoordinatesChange(String(pos.lat()), String(pos.lng()));
        });
      }
      if (pan) mapRef.current.panTo(position);
    },
    [disabled, onCoordinatesChange],
  );

  useEffect(() => {
    if (!apiKey) {
      setLoadError(
        "Set VITE_GOOGLE_MAPS_API_KEY in your .env file to enable Google Maps.",
      );
      return;
    }

    let cancelled = false;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !mapContainerRef.current || !searchInputRef.current) return;

        const g = (window as Window & { google: any }).google;
        const latNum = Number(latitude);
        const lngNum = Number(longitude);
        const center: LatLng =
          Number.isFinite(latNum) && Number.isFinite(lngNum)
            ? { lat: latNum, lng: lngNum }
            : DEFAULT_CENTER;

        mapRef.current = new g.maps.Map(mapContainerRef.current, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        setMarkerPosition(center.lat, center.lng, false);

        autocompleteRef.current = new g.maps.places.Autocomplete(
          searchInputRef.current,
          { fields: ["formatted_address", "geometry", "name"] },
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (!place?.geometry?.location) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const label =
            place.formatted_address || place.name || searchInputRef.current?.value || "";
          onSearchChange(label);
          onCoordinatesChange(String(lat), String(lng));
          setMarkerPosition(lat, lng);
        });

        setReady(true);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load Google Maps");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, onCoordinatesChange, onSearchChange, setMarkerPosition]);

  useEffect(() => {
    if (!ready) return;
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      setMarkerPosition(latNum, lngNum);
    }
  }, [latitude, longitude, ready, setMarkerPosition]);

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="company-location-search">Company Location Pin</Label>
        <Input
          id="company-location-search"
          ref={searchInputRef}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search location on Google Maps"
          className="mt-1"
          disabled={disabled || !apiKey}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Search for a location or drag the pin on the map to set coordinates.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {loadError}
        </div>
      ) : (
        <div
          ref={mapContainerRef}
          className="h-64 w-full rounded-md border bg-muted"
          aria-label="Google Map"
        />
      )}
    </div>
  );
};

export default GoogleMapLocationPicker;
