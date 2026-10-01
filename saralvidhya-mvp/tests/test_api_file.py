import os
import requests

API_BASE_URL = "http://127.0.0.1:3001"
WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESOURCES_DIR = os.path.join(WORKSPACE_ROOT, "public", "generated_resources")

def test_api_file_missing_path():
    """Verify POST /api/resources/file returns 400 when path is missing."""
    url = f"{API_BASE_URL}/api/resources/file"
    response = requests.post(url, json={}, timeout=5)
    assert response.status_code == 400
    assert "Missing path parameter" in response.json()["error"]

def test_api_file_success():
    """Create a temporary resource file, retrieve it via API, and clean up."""
    # Ensure resource dir exists
    os.makedirs(RESOURCES_DIR, exist_ok=True)

    # Write dummy file
    temp_dir = os.path.join(RESOURCES_DIR, "science", "chapter_01")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, "test_file.md")
    
    test_content = "### Test File Content for Integration Testing"
    with open(temp_file_path, "w", encoding="utf-8") as f:
        f.write(test_content)

    try:
        # Retrieve via API
        url = f"{API_BASE_URL}/api/resources/file"
        payload = {"path": "science/chapter_01/test_file.md"}
        response = requests.post(url, json=payload, timeout=5)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text}"
        assert response.text == test_content, "Retrieved content must match original content"
    finally:
        # Clean up
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

def test_api_file_path_traversal_prevention():
    """Ensure path traversal attempts are neutralized and do not return files outside the resources directory."""
    url = f"{API_BASE_URL}/api/resources/file"
    
    # Try traversing to root package.json
    payload = {"path": "../../package.json"}
    response = requests.post(url, json=payload, timeout=5)
    
    # It should not find it (returns 500 ENOENT because it evaluates to public/generated_resources/package.json which doesn't exist)
    assert response.status_code == 500, f"Expected 500 error for traverse attempt, got {response.status_code}"
    assert "ENOENT" in response.json()["error"]
