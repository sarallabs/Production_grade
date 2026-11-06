import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Define Mock Functions
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

// Mock GoogleGenerativeAI SDK using a real class constructor
class MockGoogleGenerativeAI {
  public apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  getGenerativeModel = mockGetGenerativeModel;
}

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
    GoogleGenerativeAIError: class extends Error {},
    GoogleGenerativeAIResponseError: class extends Error {},
    GoogleGenerativeAIFetchError: class extends Error {},
  };
});

// Mock Content Repository to avoid network fetches
vi.mock('@/data/contentRepository', () => {
  return {
    getResourceContent: vi.fn().mockResolvedValue('This is some mock chapter content about physics.'),
  };
});

describe('Gemini Fallback and Client SDK Integration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'PLACEHOLDER_API_KEY_FOR_TESTS');
    
    // Mock sessionStorage
    global.sessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should call the gemini API and return response text on success', async () => {
    const { askGemini } = await import('../askService');
    
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Mocked academic response',
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const result = await askGemini('What is gravity?', 'science', 'Gravity', 1);
    expect(result.answer).toBe('Mocked academic response');
    expect(result.model).toBe('gemini-3.5-flash'); // Default configured model first in fallback
    expect(mockGetGenerativeModel).toHaveBeenCalled();
  });

  it('should fall back to the next model in the list on failure', async () => {
    const { askGemini } = await import('../askService');
    
    // First call: throw a retryable error (e.g. rate limit error)
    mockGenerateContent.mockRejectedValueOnce(new Error('Rate limit exceeded 429'));
    // Second call: return successful response
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Mocked response from fallback model',
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const result = await askGemini('What is gravity?', 'science', 'Gravity', 1);
    expect(result.answer).toBe('Mocked response from fallback model');
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(2);
  });

  it('should stop fallback chain if a non-retryable error is encountered (e.g. Invalid API key)', async () => {
    const { askGemini } = await import('../askService');
    
    mockGenerateContent.mockRejectedValueOnce(new Error('api key is not valid'));

    await expect(askGemini('What is gravity?', 'science', 'Gravity', 1)).rejects.toThrow('api key is not valid');
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1); // Halts immediately
  });

  it('should prioritize sessionStorage model if set', async () => {
    // Mock sessionStorage to return a specific model
    (global.sessionStorage.getItem as any).mockReturnValue('gemini-2.5-pro');

    const { askGemini } = await import('../askService');

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Response using custom model',
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const result = await askGemini('What is gravity?', 'science', 'Gravity', 1);
    expect(result.answer).toBe('Response using custom model');
    expect(result.model).toBe('gemini-2.5-pro');
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.5-pro' });
  });
});
