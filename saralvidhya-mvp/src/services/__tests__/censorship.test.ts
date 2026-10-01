import { describe, it, expect } from 'vitest';
import { isCensored } from '../askService';

describe('Censorship Logic Tests', () => {
  describe('Blocked content validation', () => {
    it('should detect and block adult/sexual terms', () => {
      expect(isCensored('this is porn content')).toBe(true);
      expect(isCensored('some nude images')).toBe(true);
      expect(isCensored('an erotic story')).toBe(true);
    });

    it('should detect and block violence/abuse terms', () => {
      expect(isCensored('how to kill someone')).toBe(true);
      expect(isCensored('how to make a bomb')).toBe(true);
      expect(isCensored('suicide methods')).toBe(true);
    });

    it('should detect and block common profanities and vulgar language', () => {
      expect(isCensored('what the fuck is this')).toBe(true);
      expect(isCensored('you asshole')).toBe(true);
      expect(isCensored('chutiya advice')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isCensored('what the FUCK')).toBe(true);
      expect(isCensored('How to KILL')).toBe(true);
      expect(isCensored('PORNOGRAPHY has sex')).toBe(true);
    });
  });

  describe('Safe academic content validation', () => {
    it('should allow normal study questions', () => {
      expect(isCensored('How to solve quadratic equations?')).toBe(false);
      expect(isCensored('Explain the process of photosynthesis.')).toBe(false);
      expect(isCensored('Who was Mahatma Gandhi?')).toBe(false);
    });

    it('should not trigger false positives due to substring matches (word boundary checks)', () => {
      // 'assess' contains 'sess' (not blocked, but check word boundaries for 'sex' vs 'assess')
      expect(isCensored('Can you assess my performance?')).toBe(false);
      
      // 'document' contains 'cum' (which is not in our blocked list anyway, but checks boundary robustness)
      expect(isCensored('Please check this document.')).toBe(false);
      
      // 'bomb' is blocked, but 'bombard' is a valid word.
      // Wait, let's see if 'bombard' contains 'bomb'. The regex is /\b(bomb)\b/. So 'bombard' should not be blocked.
      expect(isCensored('Why did they bombard the fortress?')).toBe(false);
    });

    it('should handle reproduction-related academic questions safely (biology context)', () => {
      expect(isCensored('Describe asexual reproduction in amoeba.')).toBe(false);
      expect(isCensored('What is the difference between male and female gametes?')).toBe(false);
    });
  });
});
