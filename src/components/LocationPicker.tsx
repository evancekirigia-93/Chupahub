'use client';

import { CheckCircle2, LocateFixed, MapPin, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps';

export type DeliveryLocation = { latitude: number; longitude: number; placeId?: string; placeName?: string; verified: boolean };
export type MapsLoadState = 'loading' | 'ready' | 'error';
type Props = { address: string; onAddress: (value: string) => void; value: DeliveryLocation | null; onChange: (value: DeliveryLocation | null) => void; onLoadState?: (state: MapsLoadState) => void };

export function LocationPicker({ address, onAddress, value, onChange, onLoadState }: Props) {
  const input = useRef<HTMLInputElement>(null), mapHost = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null), marker = useRef<google.maps.Marker | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const callbacks = useRef({ onAddress, onChange });
  const [loadState, setLoadState] = useState<MapsLoadState>('loading'), [error, setError] = useState(''), [locating, setLocating] = useState(false);
  const [autocompleteReady, setAutocompleteReady] = useState(false), [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([]), [searchOpen, setSearchOpen] = useState(false), [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [autocompleteError, setAutocompleteError] = useState('');
  const ready = loadState === 'ready';

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
    let active = true;
    setLoadState('loading');
    onLoadState?.('loading');
    void loadGoogleMaps().then(async () => {
      if (!active) return;
      const places = await google.maps.importLibrary('places');
      if (!active) return;
      if (!places?.AutocompleteSuggestion?.fetchAutocompleteSuggestions || !places.AutocompleteSessionToken) {
        console.error('[Google Maps Places] Places library is missing the Place Autocomplete Data API. Enable Places API (New) for this project.');
        throw new Error('Places API (New) is unavailable.');
      }
      sessionToken.current = new places.AutocompleteSessionToken();
      setLoadState('ready'); setAutocompleteReady(true); onLoadState?.('ready'); setError('');
    }).catch(() => {
      if (!active) return;
      setLoadState('error'); onLoadState?.('error');
      setError('Google Maps is temporarily unavailable. Enter the address manually; the order will be marked Location not verified.');
    });
    return () => { active = false; if (window.google?.maps && marker.current) google.maps.event.clearInstanceListeners(marker.current); };
  }, [positionPin, onLoadState]);

  useEffect(() => {
    if (!autocompleteReady || !searchOpen || address.trim().length < 2) {
      setSearching(false); setSuggestions([]); setActiveSuggestion(-1);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      if (!sessionToken.current) sessionToken.current = new google.maps.places.AutocompleteSessionToken();
      void google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: address.trim(),
        sessionToken: sessionToken.current,
        includedRegionCodes: ['ke'],
        region: 'ke',
        locationBias: { center: { lat: -1.286389, lng: 36.817223 }, radius: 50000 },
      }).then(({ suggestions: results }) => {
        if (!active) return;
        const predictions = results.flatMap((suggestion) => suggestion.placePrediction ? [suggestion.placePrediction] : []);
        setSuggestions(predictions); setActiveSuggestion(-1);
        setAutocompleteError('');
        if (!predictions.length) console.error('[Google Maps Places] ZERO_RESULTS: no autocomplete matches were returned for the current Kenya search.');
      }).catch((cause) => {
        if (!active) return;
        const message = cause instanceof Error ? cause.message : String(cause);
        console.error('[Google Maps Places] fetchAutocompleteSuggestions rejected.', cause);
        if (/REQUEST_DENIED|denied|not authorized/i.test(message)) console.error('[Google Maps Places] REQUEST_DENIED: verify key restrictions, billing, and that Places API (New) is enabled.');
        if (/legacy|not enabled|unsupported|AutocompleteSuggestion/i.test(message)) console.error('[Google Maps Places] Places API (New) is not enabled or unavailable for this API key/project.');
        setSuggestions([]); setAutocompleteError('Address suggestions could not be loaded. You can retry your search.');
      }).finally(() => { if (active) setSearching(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [address, autocompleteReady, searchOpen]);

  async function selectSuggestion(prediction: google.maps.places.PlacePrediction) {
    setSearching(true);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents'] });
      if (!place.location) {
        console.error('[Google Maps Places] The selected Place has no location.', { placeId: place.id });
        setAutocompleteError('That location has no map coordinates. Please choose another suggestion.');
        return;
      }
      const formatted = place.formattedAddress || place.displayName || prediction.text.toString();
      const next = { latitude: place.location.lat(), longitude: place.location.lng(), placeId: place.id, placeName: place.displayName || undefined, verified: true };
      callbacks.current.onAddress(formatted); callbacks.current.onChange(next); positionPin({ lat: next.latitude, lng: next.longitude });
      setSuggestions([]); setSearchOpen(false); setActiveSuggestion(-1); setAutocompleteError(''); setError('');
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
      localStorage.setItem('chupahub-delivery-label', place.displayName || formatted.split(',')[0]);
      window.dispatchEvent(new Event('chupahub-location-updated'));
    } catch (cause) {
      console.error('[Google Maps Places] Place.fetchFields failed. Confirm Places API (New), billing, and API-key restrictions.', cause);
      setAutocompleteError('Google could not open that address. Please choose another suggestion.');
    } finally { setSearching(false); }
  }

  function searchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') { setSearchOpen(false); setActiveSuggestion(-1); return; }
    if (!searchOpen || !suggestions.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveSuggestion(current => Math.min(current + 1, suggestions.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveSuggestion(current => Math.max(current - 1, 0)); }
    else if (event.key === 'Enter' && activeSuggestion >= 0) { event.preventDefault(); void selectSuggestion(suggestions[activeSuggestion]); }
  }

  useEffect(() => { if (ready && value?.verified) positionPin({ lat: value.latitude, lng: value.longitude }); }, [positionPin, ready, value]);

  function changed(text: string) { onAddress(text); setSearchOpen(true); setAutocompleteError(''); setError(''); if (value) onChange(null); }
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

  return <div className="overflow-visible"><label className="block font-black">Search your delivery location<div className="relative mt-2 overflow-visible"><Search className="absolute left-3 top-3 text-brand-orange" size={18}/><input ref={input} value={address} onChange={(event) => changed(event.target.value)} onFocus={() => address.trim().length >= 2 && setSearchOpen(true)} onKeyDown={searchKeyDown} className="w-full rounded-xl border border-orange-200 py-3 pl-10 pr-3 font-normal" placeholder="Building, estate, road, business or landmark" autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={searchOpen && address.trim().length >= 2} aria-controls="delivery-location-suggestions"/>{searchOpen && address.trim().length >= 2 && <div id="delivery-location-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-orange-200 bg-white shadow-xl">{searching ? <p className="p-4 text-sm font-bold text-neutral-500" role="status">Searching locations…</p> : suggestions.length ? suggestions.map((prediction, index) => <button key={prediction.placeId} type="button" role="option" aria-selected={index === activeSuggestion} onMouseDown={(event) => event.preventDefault()} onClick={() => void selectSuggestion(prediction)} className={`block w-full border-b border-orange-100 px-4 py-3 text-left last:border-0 ${index === activeSuggestion ? 'bg-orange-50' : 'bg-white hover:bg-orange-50'}`}><span className="block font-bold text-brand-ink">{prediction.mainText?.toString() || prediction.text.toString()}</span>{prediction.secondaryText && <span className="mt-1 block text-sm text-neutral-600">{prediction.secondaryText.toString()}</span>}</button>) : <p className="p-4 text-sm font-bold text-neutral-600">No matching locations found</p>}</div>}</div></label>{loadState === 'loading' && <p className="mt-3 text-sm font-bold text-neutral-500" role="status">Loading Google Maps…</p>}{loadState === 'ready' && autocompleteReady && !value?.verified && <p className="mt-3 text-sm text-neutral-600" role="status">Address suggestions are available. Type at least 2 characters.</p>}{autocompleteError && <p className="mt-3 text-sm font-bold text-red-600" role="alert">{autocompleteError}</p>}<button type="button" onClick={currentLocation} disabled={locating || !ready} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold disabled:opacity-50"><LocateFixed size={17}/>{locating ? 'Finding address…' : 'Use my current location'}</button><div className={value?.verified ? 'mt-4' : 'hidden'}><div ref={mapHost} className="h-56 w-full overflow-hidden rounded-2xl border border-orange-200" aria-label="Adjust delivery location on Google Map"/><p className="mt-2 flex items-center gap-2 text-xs font-bold text-neutral-600"><MapPin size={15} className="text-brand-orange"/>Drag the pin to adjust the exact delivery point.</p></div>{value?.verified && <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700"><CheckCircle2 size={17}/> Location confirmed</p>}{error && <p className="mt-3 text-sm font-bold text-red-600" role="alert">{error}</p>}</div>;
}
