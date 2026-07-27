'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { CheckCircle2, LocateFixed, MapPin, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type DeliveryLocation = { latitude: number; longitude: number; placeId?: string; placeName?: string; verified: boolean };
type Props = { address: string; onAddress: (value: string) => void; value: DeliveryLocation | null; onChange: (value: DeliveryLocation | null) => void };

export function LocationPicker({ address, onAddress, value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null), mapHost = useRef<HTMLDivElement>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null), map = useRef<google.maps.Map | null>(null), marker = useRef<google.maps.Marker | null>(null);
  const callbacks = useRef({ onAddress, onChange });
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [locating, setLocating] = useState(false);

  useEffect(() => { callbacks.current = { onAddress, onChange }; }, [onAddress, onChange]);

  const positionPin = useCallback((position: google.maps.LatLngLiteral) => {
    if (!mapHost.current) return;
    if (!map.current) {
      map.current = new google.maps.Map(mapHost.current, { center: position, zoom: 16, streetViewControl: false, mapTypeControl: false, fullscreenControl: false });
      marker.current = new google.maps.Marker({ map: map.current, position, draggable: true, title: 'Drag to adjust your delivery point' });
      marker.current.addListener('dragend', async (event: google.maps.MapMouseEvent) => {
        const point = event.latLng;
        if (!point) return;
        const latitude = point.lat(), longitude = point.lng();
        map.current?.panTo(point);
        try {
          const result = await new google.maps.Geocoder().geocode({ location: { lat: latitude, lng: longitude } }), place = result.results[0];
          if (place?.formatted_address) callbacks.current.onAddress(place.formatted_address);
          callbacks.current.onChange({ latitude, longitude, placeId: place?.place_id, placeName: place?.address_components[0]?.long_name, verified: Boolean(place) });
          setError(place ? '' : 'Pin adjusted. Please confirm the written delivery address.');
        } catch {
          callbacks.current.onChange({ latitude, longitude, verified: false });
          setError('Pin adjusted, but Google could not verify this exact point. Please confirm the written address.');
        }
      });
    } else {
      map.current.setCenter(position);
      marker.current?.setPosition(position);
    }
    requestAnimationFrame(() => {
      if (!map.current) return;
      google.maps.event.trigger(map.current, 'resize');
      map.current.setCenter(position);
    });
  }, []);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) { setError('Google Maps is temporarily unavailable. Enter the address manually; the order will be marked Location not verified.'); return; }
    let active = true;
    setOptions({ key, v: 'weekly' });
    void Promise.all([importLibrary('places'), importLibrary('maps'), importLibrary('marker'), importLibrary('geocoding')]).then(() => {
      if (!active || !input.current) return;
      autocomplete.current = new google.maps.places.Autocomplete(input.current, { componentRestrictions: { country: 'ke' }, fields: ['place_id', 'name', 'formatted_address', 'geometry'] });
      autocomplete.current.addListener('place_changed', () => {
        const place = autocomplete.current?.getPlace(), point = place?.geometry?.location;
        if (!place?.place_id || !point) { callbacks.current.onChange(null); setError('Please select your delivery location from the Google suggestions.'); return; }
        const formatted = place.formatted_address || place.name || '', next = { latitude: point.lat(), longitude: point.lng(), placeId: place.place_id, placeName: place.name, verified: true };
        callbacks.current.onAddress(formatted); callbacks.current.onChange(next); positionPin({ lat: next.latitude, lng: next.longitude }); setError('');
        localStorage.setItem('chupahub-delivery-label', place.name || formatted.split(',')[0]);
        window.dispatchEvent(new Event('chupahub-location-updated'));
      });
      setReady(true);
    }).catch(() => setError('Google Maps is temporarily unavailable. Enter the address manually; the order will be marked Location not verified.'));
    return () => { active = false; if (autocomplete.current) google.maps.event.clearInstanceListeners(autocomplete.current); if (marker.current) google.maps.event.clearInstanceListeners(marker.current); };
  }, [positionPin]);

  useEffect(() => { if (ready && value?.verified) positionPin({ lat: value.latitude, lng: value.longitude }); }, [positionPin, ready, value]);

  function changed(text: string) { onAddress(text); if (value) onChange(null); }
  function currentLocation() {
    if (!navigator.geolocation) { setError('Location is not supported by this browser.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const position = { lat: coords.latitude, lng: coords.longitude };
      try {
        const result = await new google.maps.Geocoder().geocode({ location: position }), place = result.results[0];
        if (!place) throw new Error();
        onAddress(place.formatted_address); onChange({ latitude: position.lat, longitude: position.lng, placeId: place.place_id, placeName: place.address_components[0]?.long_name, verified: true });
        positionPin(position); setError('');
      } catch { onChange({ latitude: position.lat, longitude: position.lng, verified: false }); setError('We found your coordinates but could not verify the Google address. Enter delivery details manually.'); }
      finally { setLocating(false); }
    }, () => { setError('Location permission was not granted. Search for your delivery location instead.'); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000 });
  }

  return <div><label className="block font-black">Search your delivery location<div className="relative mt-2"><Search className="absolute left-3 top-3 text-brand-orange" size={18}/><input ref={input} value={address} onChange={(event) => changed(event.target.value)} className="w-full rounded-xl border border-orange-200 py-3 pl-10 pr-3 font-normal" placeholder="Building, estate, road, business or landmark" autoComplete="off"/></div></label><button type="button" onClick={currentLocation} disabled={locating || !ready} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold disabled:opacity-50"><LocateFixed size={17}/>{locating ? 'Finding address…' : 'Use my current location'}</button><div className={value?.verified ? 'mt-4' : 'hidden'}><div ref={mapHost} className="h-56 w-full overflow-hidden rounded-2xl border border-orange-200" aria-label="Adjust delivery location on Google Map"/><p className="mt-2 flex items-center gap-2 text-xs font-bold text-neutral-600"><MapPin size={15} className="text-brand-orange"/>Drag the pin to adjust the exact delivery point.</p></div>{value?.verified && <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700"><CheckCircle2 size={17}/> Location confirmed</p>}{error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}</div>;
}
