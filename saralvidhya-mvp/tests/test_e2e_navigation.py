import pytest
from playwright.sync_api import Page, expect

def test_e2e_app_navigation(page: Page):
    """Verify selecting a board, selecting a class, and loading the study table for Chapter 1."""
    
    # 1. Access the site and set up authenticated mock state in LocalStorage
    page.goto("http://localhost:5173/")
    page.evaluate("""() => {
        localStorage.setItem('app_authenticated', 'true');
        localStorage.setItem('username', 'TestStudent');
        localStorage.setItem('saral_student_profile', '{"name":"Test Student","class":"NCERT Class 10"}');
        localStorage.setItem('questionnaire_completed', 'true');
    }""")
    
    # 2. Reload page to apply authenticated state
    page.goto("http://localhost:5173/")
    page.wait_for_load_state("networkidle")

    # Assert we bypassed login and are on the dashboard
    expect(page.locator(".sv-persona-tree-logo")).to_be_visible()

    # 3. Click the first board card (e.g. CBSE)
    boards = page.locator(".sv-class-card")
    expect(boards.first).to_be_visible()
    boards.first.click()

    # 4. Click the first class card
    classes = page.locator(".sv-class-card")
    expect(classes.first).to_be_visible()
    classes.first.click()

    # 5. Click the Science subject card
    science_subject = page.locator(".sv-subject-card", has_text="Science").first
    expect(science_subject).to_be_visible()
    science_subject.click()

    # 6. Verify we navigated to the chapters page
    page.wait_for_url("**/chapters?*")
    assert "/chapters" in page.url
    
    # Verify the page subject title is "Science"
    expect(page.locator("h1.book-title")).to_contain_text("Science")

    # 7. Click on the first chapter book card
    first_chapter = page.locator(".book-card").first
    expect(first_chapter).to_be_visible()
    first_chapter.click()

    # 8. Wait for study table navigation (includes 800ms card flip timeout)
    page.wait_for_url("**/study-table?*", timeout=8000)
    assert "/study-table" in page.url

    # Check if study table container is present
    expect(page.locator(".st-app")).to_be_visible()
