import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

declare global {
  interface Window {
    google?: any;
  }
}

const SCRIPT_ID = 'google-maps-places-script';
let scriptPromise: Promise<void> | null = null;

function loadScript(apiKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => {
      scriptPromise = null;
      reject(e);
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface PlacesAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function PlacesAutocompleteInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  id,
}: PlacesAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [localValue, setLocalValue] = useState(value);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  // Keep onChange ref up to date without re-running autocomplete init
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync external value to local state (e.g. when form resets)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || autocompleteRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'place_id'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const addr = place.formatted_address || '';
      setLocalValue(addr);
      onChangeRef.current(addr);
    });
    autocompleteRef.current = ac;
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    loadScript(apiKey).then(initAutocomplete).catch(() => {
      // No API key or script failed — degrade to plain text input
    });
  }, [apiKey, initAutocomplete]);

  return (
    <input
      ref={inputRef}
      id={id}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        onChangeRef.current(e.target.value);
      }}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      className={cn(
        'flex h-11 w-full rounded-lg border px-4 py-2 text-sm',
        'backdrop-blur-sm ring-offset-2',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 focus-visible:shadow-lg focus-visible:shadow-blue-500/20',
        'hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 ease-out focus:scale-[1.01]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      style={{
        background: 'var(--input-bg)',
        borderColor: 'var(--input-border)',
        color: 'var(--text-primary)',
      }}
    />
  );
}
