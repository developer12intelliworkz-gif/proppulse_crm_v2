let googleMapsScriptLoading: Promise<void> | null = null;

export const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  const g = (window as Window & { google?: { maps: unknown } }).google;
  if (g?.maps) return Promise.resolve();
  if (googleMapsScriptLoading) return googleMapsScriptLoading;

  googleMapsScriptLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps failed to load")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return googleMapsScriptLoading;
};

export const getGoogleMapsApiKey = (): string | undefined =>
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
