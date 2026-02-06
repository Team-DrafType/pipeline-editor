import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { SavedPipeline } from '../types';

const STORAGE_KEY = 'pipeline-editor-saved';

export function useLocalStorage() {
  const getSavedPipelines = useCallback((): SavedPipeline[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const savePipeline = useCallback(
    (name: string, nodes: Node[], edges: Edge[]) => {
      const saved = getSavedPipelines();
      const newEntry: SavedPipeline = {
        id: `save_${Date.now()}`,
        name,
        timestamp: Date.now(),
        nodes,
        edges,
      };
      saved.unshift(newEntry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      return newEntry;
    },
    [getSavedPipelines]
  );

  const deletePipeline = useCallback(
    (id: string) => {
      const saved = getSavedPipelines().filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    },
    [getSavedPipelines]
  );

  return { getSavedPipelines, savePipeline, deletePipeline };
}
