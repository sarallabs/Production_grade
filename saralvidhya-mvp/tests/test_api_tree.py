import requests

API_BASE_URL = "http://127.0.0.1:3001"

def test_api_resources_tree():
    """Verify GET /api/resources/tree returns a valid folder tree array."""
    url = f"{API_BASE_URL}/api/resources/tree"
    try:
        response = requests.get(url, timeout=5)
    except requests.exceptions.RequestException as e:
        pytest_fail_message = f"Express server is not running or unreachable at {API_BASE_URL}. Error: {e}"
        raise AssertionError(pytest_fail_message)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    
    # Assert JSON payload
    tree = response.json()
    assert isinstance(tree, list), "Root response must be a JSON array"

    # Helper function to validate node structure recursively
    def validate_node(node):
        assert "type" in node, "Node must have a 'type'"
        assert node["type"] in ["directory", "file"], "Node type must be either 'directory' or 'file'"
        assert "name" in node, "Node must have a 'name'"
        assert "path" in node, "Node must have a 'path'"
        
        if node["type"] == "directory":
            assert "children" in node, "Directory node must contain a 'children' key"
            assert isinstance(node["children"], list), "'children' must be a list"
            for child in node["children"]:
                validate_node(child)
        else:
            assert "children" not in node, "File node should not contain 'children'"

    # Validate all top-level items in tree
    for item in tree:
        validate_node(item)
