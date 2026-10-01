import pytest
from playwright.sync_api import Page, expect

def test_e2e_chat_interaction(page: Page):
    """Verify that a student can open the AI tutor drawer, send a question, and receive a response."""
    
    # 1. Access the study table page directly with authenticated local storage state
    page.goto("http://localhost:5173/")
    page.evaluate("""() => {
        localStorage.setItem('app_authenticated', 'true');
        localStorage.setItem('username', 'TestStudent');
        localStorage.setItem('saral_student_profile', '{"name":"Test Student","class":"NCERT Class 10"}');
        localStorage.setItem('questionnaire_completed', 'true');
    }""")
    
    study_table_url = (
        "http://localhost:5173/study-table?"
        "boardId=cbse&boardName=CBSE&cId=cbse_class_10&className=CBSE+Class+X&"
        "sId=science&subjectName=Science&persona=beginner&chapter=1&"
        "chapterName=Chemical+Reactions+and+Equations"
    )
    
    page.goto(study_table_url)
    page.wait_for_load_state("networkidle")

    # Assert study table container is visible
    expect(page.locator(".st-app")).to_be_visible()

    # 2. Click the "Ask AI Tutor" button to open the chat panel
    tutor_btn = page.locator(".sv-ai-tutor-btn")
    expect(tutor_btn).to_be_visible()
    tutor_btn.click()

    # Assert the AI study tutor drawer slides in
    drawer = page.locator(".ask-sidebar-drawer")
    expect(drawer).to_be_visible()

    # 3. Enter a safe study-related question
    question_input = page.locator("input.ask-question-input")
    expect(question_input).to_be_visible()
    question_input.fill("What is a chemical equation?")

    # 4. Click the send button (Ask button)
    send_btn = page.locator("button.btn-send")
    expect(send_btn).to_be_enabled()
    send_btn.click()

    # 5. Verify the question is rendered in the chat bubble
    user_bubble = page.locator(".chat-bubble.user", has_text="What is a chemical equation?")
    expect(user_bubble).to_be_visible()

    # 6. Verify that the bot response Markdown container is loaded (allowing up to 15s for Gemini API latency)
    bot_markdown = page.locator(".chat-bubble.bot .bot-markdown")
    expect(bot_markdown).to_be_visible(timeout=15000)

    # Confirm the response contains actual text content
    expect(bot_markdown).not_to_be_empty()
