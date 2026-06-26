import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadGoogleMapsScript, getGoogleMapsApiKey } from "@/utils/googleMapsLoader";
import {
  parseGooglePlaceAddress,
  type ParsedProjectAddress,
} from "@/utils/parseGooglePlaceAddress";

type LatLng = { lat: number; lng: number };

const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 };

interface ProjectLocationPickerProps {
  searchAddress: string;
  latitude: string;
  longitude: string;
  onSearchAddressChange: (value: string) => void;
  onPlaceResolved: (address: ParsedProjectAddress) => void;
  onCoordinatesChange: (lat: string, lng: string) => void;
  searchError?: string;
  disabled?: boolean;
}

const ProjectLocationPicker = ({
  searchAddress,
  latitude,
  longitude,
  onSearchAddressChange,
  onPlaceResolved,
  onCoordinatesChange,
  searchError,
  disabled = false,
}: ProjectLocationPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
      address_components?: {
        long_name: string;
        short_name: string;
        types: string[];
      }[];
      geometry?: { location: { lat: () => number; lng: () => number } };
    };
    addListener: (event: string, cb: () => void) => void;
  } | null>(null);
  const geocoderRef = useRef<{
    geocode: (
      request: { location: LatLng },
      callback: (
        results: Parameters<typeof parseGooglePlaceAddress>[0][] | null,
        status: string,
      ) => void,
    ) => void;
  } | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const apiKey = getGoogleMapsApiKey();

  const applyParsedPlace = useCallback(
    (parsed: ParsedProjectAddress) => {
      onPlaceResolved(parsed);
      onSearchAddressChange(parsed.search_address);
    },
    [onPlaceResolved, onSearchAddressChange],
  );

  const setMarkerPosition = useCallback(
    (lat: number, lng: number, pan = true) => {
      if (!mapRef.current) return;
      const position: LatLng = { lat, lng };
      const g = (window as Window & { google: any }).google;

      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        markerRef.current = new g.maps.Marker({
          position,
          map: mapRef.current,
          draggable: !disabled,
        });
        markerRef.current.addListener("dragend", () => {
          const pos = markerRef.current?.getPosition();
          if (!pos || !geocoderRef.current) return;
          const dragLat = pos.lat();
          const dragLng = pos.lng();
          onCoordinatesChange(String(dragLat), String(dragLng));
          geocoderRef.current.geocode(
            { location: { lat: dragLat, lng: dragLng } },
            (results, status) => {
              if (status !== "OK" || !results?.[0]) return;
              const parsed = parseGooglePlaceAddress({
                ...results[0],
                geometry: {
                  location: {
                    lat: () => dragLat,
                    lng: () => dragLng,
                  },
                },
              });
              if (parsed) applyParsedPlace(parsed);
            },
          );
        });
      }
      if (pan) mapRef.current.panTo(position);
    },
    [applyParsedPlace, disabled, onCoordinatesChange],
  );

  useEffect(() => {
    if (!apiKey) {
      setLoadError(
        "Google Maps is not configured yet. Skip this step or enter the address manually in the fields on the left.",
      );
      return;
    }

    let cancelled = false;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !mapContainerRef.current || !searchInputRef.current) {
          return;
        }

        const g = (window as Window & { google: any }).google;
        const latNum = Number(latitude);
        const lngNum = Number(longitude);
        const center: LatLng =
          Number.isFinite(latNum) && Number.isFinite(lngNum)
            ? { lat: latNum, lng: lngNum }
            : DEFAULT_CENTER;

        mapRef.current = new g.maps.Map(mapContainerRef.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
        });

        geocoderRef.current = new g.maps.Geocoder();
        setMarkerPosition(center.lat, center.lng, false);

        autocompleteRef.current = new g.maps.places.Autocomplete(
          searchInputRef.current,
          {
            fields: [
              "formatted_address",
              "geometry",
              "name",
              "address_components",
            ],
            types: ["geocode", "establishment"],
          },
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          const parsed = place ? parseGooglePlaceAddress(place) : null;
          if (!parsed) return;
          applyParsedPlace(parsed);
          setMarkerPosition(Number(parsed.latitude), Number(parsed.longitude));
        });

        setReady(true);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load Google Maps",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, applyParsedPlace, setMarkerPosition]);

  useEffect(() => {
    if (!ready) return;
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      setMarkerPosition(latNum, lngNum);
    }
  }, [latitude, longitude, ready, setMarkerPosition]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="project-location-search" className="text-lg font-medium">
          Search Project Address on Google Maps (optional)
        </Label>
        <Input
          id="project-location-search"
          ref={searchInputRef}
          value={searchAddress}
          onChange={(e) => onSearchAddressChange(e.target.value)}
          placeholder="Start typing an address, area, or landmark…"
          className="mt-2 text-lg"
          disabled={disabled || !apiKey}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground mt-1">
          When Maps is enabled, pick a suggestion to auto-fill address fields.
          Otherwise skip this step or type the address manually on the left.
        </p>
        {searchError && (
          <p className="text-red-600 text-sm mt-1">{searchError}</p>
        )}
      </div>

      {loadError ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground h-96 flex items-center justify-center">
          {loadError}
        </div>
      ) : (
        <div
          ref={mapContainerRef}
          className="h-96 w-full rounded-lg border bg-muted"
          aria-label="Google Map"
        />
      )}
    </div>
  );
};

export default ProjectLocationPicker;
