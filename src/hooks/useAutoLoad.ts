import { useEffect, useCallback, useRef } from 'react';
import useFlowStore from '../store/useFlowStore';
import type { PresetPipeline } from '../types';

const GENERATED_URL = '/generated-pipeline.json';
const POLL_INTERVAL = 2000; // 2초마다 체크

export default function useAutoLoad() {
  const loadPreset = useFlowStore((s) => s.loadPreset);
  const lastLoaded = useRef<string | null>(null);

  const checkForPipeline = useCallback(async () => {
    try {
      const res = await fetch(GENERATED_URL, { cache: 'no-store' });
      if (!res.ok) return;

      const text = await res.text();
      if (!text.trim() || text === lastLoaded.current) return;

      const pipeline = JSON.parse(text) as PresetPipeline;
      if (!pipeline.nodes || !Array.isArray(pipeline.nodes)) return;

      // 유효한 파이프라인 발견 - 로드
      lastLoaded.current = text;

      // id가 없으면 추가
      if (!pipeline.id) pipeline.id = 'auto-loaded';
      if (!pipeline.name) pipeline.name = '자동 로드된 파이프라인';
      if (!pipeline.description) pipeline.description = '';
      if (!pipeline.edges) pipeline.edges = [];

      loadPreset(pipeline);

      console.log('[Pipeline Editor] 파이프라인 자동 로드:', pipeline.name);
    } catch {
      // 파일이 없거나 파싱 실패 - 무시
    }
  }, [loadPreset]);

  useEffect(() => {
    // 초기 체크
    checkForPipeline();

    // 주기적 폴링
    const interval = setInterval(checkForPipeline, POLL_INTERVAL);

    // 탭 포커스 시 체크
    const onFocus = () => checkForPipeline();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkForPipeline]);
}
