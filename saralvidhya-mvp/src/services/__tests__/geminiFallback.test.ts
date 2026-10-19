import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cloudStorage } from '@/context/CloudStateContext';
import { askGemini } from '../askService';

// Mock Content Repository to avoid network fetches
vi.mock('@/data/contentRepository', () => {
  return {
    getResourceContent: vi.fn().mockResolvedValue('This is some mock chapter content about physics.'),
  };
});

describe('Cloud-Native Ask Gemini Proxy & Fallback Integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    cloudStorage.clear();
    cloudStorage.setItem('current_tenant_id', 'demo_tenant');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('should call the Cloud Run AI proxy and return response text on success', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: 'Mocked academic response from Cloud Run',
        model: 'gemini-2.5-flash',
      }),
    } as any);

    const result = await askGemini('What is gravity?', 'science', 'Gravity', 1);
    expect(result.answer).toBe('Mocked academic response from Cloud Run');
    expect(result.model).toBe('gemini-2.5-flash');
  });

  it('should prioritize cloudStorage model if set', async () => {
    cloudStorage.setItem('sv_gemini_model', 'gemini-2.5-pro');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: 'Response using custom model',
        model: 'gemini-2.5-pro',
      }),
    } as any);

    const result = await askGemini('What is gravity?', 'science', 'Gravity', 1);
    expect(result.answer).toBe('Response using custom model');
    expect(result.model).toBe('gemini-2.5-pro');
  });
});
