'use client';

import { importLibrary } from '@googlemaps/js-api-loader';
import { useEffect, useRef } from 'react';
import type { DeliveryLocation } from './LocationPicker';

export function GoogleLocationMap({ location }: { location: DeliveryLocation }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => { let marker: google.maps.marker.AdvancedMarkerElement | undefined; void Promise.all([importLibrary('maps'), importLibrary('marker')]).then(([maps, markers]) => { if (!container.current) return; const center = { lat: location.latitude, lng: location.longitude }; const map = new maps.Map(container.current, { center, zoom: 16, mapId: 'CHUPAHUB_DELIVERY_CONFIRMATION', disableDefaultUI: true, zoomControl: true }); marker = new markers.AdvancedMarkerElement({ map, position: center, title: location.placeName || 'Confirmed delivery location', gmpDraggable: false }); }); return () => { if (marker) marker.map = null; }; }, [location.latitude, location.longitude, location.placeName]);
  return <><div ref={container} className="mt-3 h-64 w-full overflow-hidden rounded-xl border border-orange-100" aria-label="Confirmed Google Maps delivery location"/><a className="mt-2 inline-block text-sm font-bold text-brand-orange" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}>Open confirmed location in Google Maps</a></>;
}
