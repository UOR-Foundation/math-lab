import { useCallback, useState, useEffect } from 'react';
import { storageManager, StorageLayer, StorageEvent } from '../core/storage';

/**
 * Hook for interacting with the storage system
 * 
 * @param key The key to use for storage
 * @param initialValue The initial value to use if the key doesn't exist
 * @param layer The storage layer to use (defaults to LOCAL)
 * @returns A tuple of [value, setValue, loading, error]
 */
export function useStorage<T>(
  key: string,
  initialValue: T,
  layer: StorageLayer = StorageLayer.LOCAL
): [T, (value: T) => Promise<void>, boolean, Error | null] {
  const [value, setStateValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load the initial value from storage
  useEffect(() => {
    let isMounted = true;

    const loadValue = async () => {
      try {
        setLoading(true);
        const storedValue = await storageManager.get<T>(key, layer);
        
        if (isMounted) {
          setStateValue(storedValue !== null ? storedValue : initialValue);
          setError(null);
        }
      } catch (err) {
        console.error(`Error loading storage value for key "${key}":`, err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadValue();

    // Add event listener for storage changes
    const removeListener = storageManager.addEventListener(
      StorageEvent.ITEM_UPDATED,
      (_event, updatedKey) => {
        if (updatedKey === key) {
          loadValue();
        }
      }
    );

    return () => {
      isMounted = false;
      removeListener();
    };
  }, [key, initialValue, layer]);

  // Function to update the value in storage
  const setValue = useCallback(
    async (newValue: T) => {
      try {
        await storageManager.set(key, newValue, layer);
        setStateValue(newValue);
        setError(null);
      } catch (err) {
        console.error(`Error saving storage value for key "${key}":`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [key, layer]
  );

  return [value, setValue, loading, error];
}

/**
 * Hook for interacting with session storage
 * 
 * @param key The key to use for storage
 * @param initialValue The initial value to use if the key doesn't exist
 * @returns A tuple of [value, setValue, loading, error]
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => Promise<void>, boolean, Error | null] {
  return useStorage<T>(key, initialValue, StorageLayer.SESSION);
}

/**
 * Hook for interacting with local storage
 * 
 * @param key The key to use for storage
 * @param initialValue The initial value to use if the key doesn't exist
 * @returns A tuple of [value, setValue, loading, error]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => Promise<void>, boolean, Error | null] {
  return useStorage<T>(key, initialValue, StorageLayer.LOCAL);
}

/**
 * Hook for interacting with cloud storage
 * 
 * @param key The key to use for storage
 * @param initialValue The initial value to use if the key doesn't exist
 * @returns A tuple of [value, setValue, loading, error]
 */
export function useCloudStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => Promise<void>, boolean, Error | null] {
  return useStorage<T>(key, initialValue, StorageLayer.CLOUD);
}