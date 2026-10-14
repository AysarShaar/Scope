'use client';

import { useEffect, useState } from 'react';
import { newsService } from '../services/newsService';

const STORAGE_KEY = 'scope_setting_live_stream_id';

function clean(id: unknown): string {
  return typeof id === 'string' ? id.trim() : '';
}

function readCached(): string {
  try {
    return clean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return '';
  }
}

function writeCached(id: string) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable: ignore
  }
}

let inFlightSettingsPromise: Promise<string> | null = null;
let cachedSettingsId: string | null = null;
let settingsCacheTimestamp = 0;
const SETTINGS_CACHE_TTL_MS = 60000;

async function fetchLiveStreamId(): Promise<string> {
  const now = Date.now();
  if (cachedSettingsId !== null && now - settingsCacheTimestamp < SETTINGS_CACHE_TTL_MS) {
    return cachedSettingsId;
  }
  if (inFlightSettingsPromise) {
    return inFlightSettingsPromise;
  }

  inFlightSettingsPromise = (async () => {
    try {
      // On the home page the id already travels with the shared /api/home request: reuse it.
      const pending = newsService.peekHomeBootstrap();
      if (pending) {
        const boot = await pending;
        if (boot) {
          const next = clean(boot.liveStreamId);
          cachedSettingsId = next;
          settingsCacheTimestamp = Date.now();
          writeCached(next);
          return next;
        }
      }

      const res = await fetch('/api/settings');
      if (res.ok) {
        const d = await res.json().catch(() => null);
        if (d?.data) {
          const next = clean(d.data.live_stream_id);
          cachedSettingsId = next;
          settingsCacheTimestamp = Date.now();
          writeCached(next);
          return next;
        }
      }
    } catch {
      // ignore
    }
    return cachedSettingsId !== null ? cachedSettingsId : readCached();
  })().finally(() => {
    inFlightSettingsPromise = null;
  });

  return inFlightSettingsPromise;
}

export function useLiveStreamId(enabled = true): string {
  const [id, setId] = useState(() => (cachedSettingsId !== null ? cachedSettingsId : readCached()));

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const onStorage = () => {
      const current = readCached();
      cachedSettingsId = current;
      setId(current);
    };
    window.addEventListener('storage', onStorage);

    fetchLiveStreamId().then((next) => {
      if (!cancelled) {
        setId(next);
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, [enabled]);

  return id;
}
