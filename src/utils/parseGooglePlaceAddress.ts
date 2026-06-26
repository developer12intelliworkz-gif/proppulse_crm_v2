export interface ParsedProjectAddress {
  search_address: string;
  address: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  latitude: string;
  longitude: string;
}

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GooglePlaceLike = {
  formatted_address?: string;
  name?: string;
  address_components?: AddressComponent[];
  geometry?: { location: { lat: () => number; lng: () => number } };
};

function getComponent(
  components: AddressComponent[],
  ...types: string[]
): string {
  for (const type of types) {
    const match = components.find((c) => c.types.includes(type));
    if (match?.long_name) return match.long_name;
  }
  return "";
}

/** Parse Google Places result into project address fields. */
export function parseGooglePlaceAddress(
  place: GooglePlaceLike,
): ParsedProjectAddress | null {
  if (!place.geometry?.location) return null;

  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const components = place.address_components ?? [];

  const streetNumber = getComponent(components, "street_number");
  const route = getComponent(components, "route");
  const street = [streetNumber, route].filter(Boolean).join(" ").trim();

  const locality = getComponent(
    components,
    "sublocality_level_1",
    "sublocality_level_2",
    "sublocality",
    "neighborhood",
  );

  const city = getComponent(
    components,
    "locality",
    "administrative_area_level_2",
    "postal_town",
  );

  const state = getComponent(components, "administrative_area_level_1");
  const country = getComponent(components, "country");
  const zip = getComponent(components, "postal_code");

  const formatted =
    place.formatted_address?.trim() || place.name?.trim() || "";

  const address =
    street ||
    formatted.split(",").map((p) => p.trim()).filter(Boolean)[0] ||
    formatted;

  return {
    search_address: formatted,
    address,
    street,
    locality,
    city,
    state,
    country,
    zip,
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
  };
}
