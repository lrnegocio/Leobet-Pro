'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSupabaseTable<T>(table: string, filter?: { column: string; value: any }) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let query = supabase.from(table).select('*');
        
        if (filter) {
          query = query.eq(filter.column, filter.value);
        }

        const { data: result, error: err } = await query;
        
        if (err) throw err;
        setData(result as T[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, filter]);

  return { data, loading, error };
}
