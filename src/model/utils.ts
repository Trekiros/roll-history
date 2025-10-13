import { DependencyList, useEffect, useState } from "react";
import { Category, CategorySchema } from "./model";

export function usePromise<T>(promiseFn: () => Promise<T>, deps: DependencyList = []) {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        try {
            promiseFn()
                .then((res) => {
                    if (isMounted) {
                        setData(res)
                        setLoading(false)
                    }
                })
                .catch((err) => {
                    if (isMounted) {
                        setError(err)
                        setLoading(false)
                    }
                })
        } catch (e: any) {
            setError(e)
            setLoading(false)
        }

        return () => {
            isMounted = false
        }
    }, deps) // re-run when dependencies change

    return { data, loading, error }
}

export async function fetchCategory(fileName: string): Promise<Category> {
    const result = await fetchCachedJson(fileName)

    return CategorySchema.parse(result)
}

async function fetchCachedJson<T = unknown>(filename: string): Promise<T> {
  const cacheKey = `cached_json_${filename}`;
  const timestampKey = `${cacheKey}_timestamp`;

  try {
    const cached = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(timestampKey);

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (cached && cachedTimestamp) {
      const age = now - parseInt(cachedTimestamp, 10);
      if (age < twentyFourHours) {
        return JSON.parse(cached) as T;
      }
    }

    const response = await fetch(`/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
    }

    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(timestampKey, now.toString());

    return data as T;
  } catch (error) {
    console.error('Error fetching cached JSON:', error);
    throw error;
  }
}
