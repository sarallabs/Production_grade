import re
import sys

def validate_gemini_api_key(api_key: str) -> bool:
    """
    Validates a Google Gemini API Key.
    Old format: Starts with 'AIzaSy' and is ~39 characters long.
    New format (Google AI Studio recent changes): Starts with 'AQ.' and is ~53 characters long.
    """
    if not api_key:
        return False
        
    api_key = api_key.strip()
    
    # Check new format (starts with AQ., ~53 characters)
    if api_key.startswith("AQ.") and len(api_key) >= 50:
        return True
        
    # Check old format (starts with AIzaSy, ~39 characters)
    if api_key.startswith("AIzaSy") and len(api_key) >= 35:
        return True
        
    return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        key_to_test = sys.argv[1]
        is_valid = validate_gemini_api_key(key_to_test)
        print(f"API Key Valid: {is_valid}")
    else:
        test_keys = [
            "AQ.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwx",
            "AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg",
            "invalid_key_format",
            "AQ.short",
            "AIzaSyshort"
        ]
        
        print("Running tests on sample keys:\n")
        for key in test_keys:
            is_valid = validate_gemini_api_key(key)
            print(f"Key: {key[:15]}... -> Valid: {is_valid}")
        
        print("\nUsage: python validate_gemini_api_key.py <YOUR_API_KEY>")
