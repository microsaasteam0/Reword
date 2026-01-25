import re
from typing import List

def clean_text(text: str) -> str:
    """Clean text by removing excessive formatting and normalizing content"""
    if not text:
        return text
    
    # Remove excessive asterisks and formatting
    text = re.sub(r'\*{3,}', '', text)  # Remove 3+ asterisks
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # Remove bold formatting
    text = re.sub(r'\*([^*]+)\*', r'\1', text)  # Remove italic formatting
    
    # Clean up excessive emojis (more than 3 in a row)
    text = re.sub(r'([\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002600-\U000027BF\U0001F900-\U0001F9FF]){4,}', r'\1\1\1', text)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text

def clean_twitter_thread(tweets: List[str]) -> List[str]:
    """Clean and validate Twitter thread"""
    cleaned_tweets = []
    for i, tweet in enumerate(tweets):
        cleaned = clean_text(tweet)
        
        # Ensure tweet starts with numbering if not present
        if not re.match(r'^\d+/\d+', cleaned):
            cleaned = f"{i+1}/10 {cleaned}"
        
        # Ensure hashtags are present and at the end
        if not re.search(r'#\w+', cleaned):
            cleaned += " #Tips #Growth"
        
        # Ensure hashtags are at the end of the post
        hashtag_match = re.search(r'(#\w+(?:\s+#\w+)*)', cleaned)
        if hashtag_match:
            hashtags = hashtag_match.group(1)
            main_content = cleaned.replace(hashtags, '').strip()
            cleaned = f"{main_content} {hashtags}"
        
        # Ensure tweet is under 200 characters
        if len(cleaned) > 200:
            # Extract hashtags first
            hashtag_match = re.search(r'(#\w+(?:\s+#\w+)*)', cleaned)
            hashtags = hashtag_match.group(1) if hashtag_match else "#Tips #Growth"
            
            # Remove hashtags temporarily
            main_content = re.sub(r'#\w+(?:\s+#\w+)*', '', cleaned).strip()
            
            # Truncate main content to fit with hashtags
            max_main_length = 190 - len(hashtags)  # Leave room for hashtags and space
            if len(main_content) > max_main_length:
                words = main_content.split()
                truncated = ""
                for word in words:
                    test_length = len(truncated + " " + word) if truncated else len(word)
                    if test_length <= max_main_length - 3:  # -3 for "..."
                        truncated += " " + word if truncated else word
                    else:
                        break
                main_content = truncated + "..."
            
            cleaned = f"{main_content} {hashtags}"
        
        # Ensure the tweet makes sense and isn't just a fragment
        main_content_only = re.sub(r'\d+/\d+\s*', '', cleaned).replace('#', '').strip()
        if len(main_content_only) < 20:
            # Tweet is too short, use a default
            cleaned = f"{i+1}/10 💡 This is an important insight worth sharing. #Tips #Growth"
        
        cleaned_tweets.append(cleaned)
    
    return cleaned_tweets

def clean_linkedin_post(post: str) -> str:
    """Clean LinkedIn post content and ensure proper formatting"""
    cleaned = clean_text(post)
    
    # If there are no double line breaks, create them intelligently
    if '\n\n' not in cleaned:
        # Split by periods and create paragraph breaks
        sentences = cleaned.split('. ')
        formatted_sentences = []
        sentence_count = 0
        
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Add period back if it's not the last sentence
            if i < len(sentences) - 1 and not sentence.endswith(('.', '!', '?')):
                sentence += '.'
            
            # Create paragraph breaks after certain patterns
            if (sentence_count == 0 and re.match(r'^[💡🚀🎯✨💪🔥⚡]', sentence)) or \
               ('Key' in sentence and ('points' in sentence or 'insights' in sentence)) or \
               sentence.startswith('•') or \
               '#' in sentence:
                # Start new paragraph
                if formatted_sentences:
                    formatted_sentences.append('\n\n' + sentence)
                else:
                    formatted_sentences.append(sentence)
                sentence_count = 0
            else:
                if sentence_count >= 2:  # After 2-3 sentences, create new paragraph
                    formatted_sentences.append('\n\n' + sentence)
                    sentence_count = 0
                else:
                    if formatted_sentences:
                        formatted_sentences.append(' ' + sentence)
                    else:
                        formatted_sentences.append(sentence)
                    sentence_count += 1
        
        cleaned = ''.join(formatted_sentences)
    
    # Ensure proper paragraph breaks (double line breaks)
    cleaned = re.sub(r'(?<!\n)\n(?!\n)', '\n\n', cleaned)
    
    # Clean up excessive line breaks (more than 2)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    
    # Ensure bullet points are properly formatted
    cleaned = re.sub(r'^\s*[-*]\s*', '• ', cleaned, flags=re.MULTILINE)
    
    # Ensure hashtags are on a new line
    hashtag_pattern = r'([.!?])\s*(#\w+)'
    cleaned = re.sub(hashtag_pattern, r'\1\n\n\2', cleaned)
    
    # Clean up any remaining formatting issues
    cleaned = cleaned.strip()
    
    return cleaned

def clean_instagram_slides(slides: List[str]) -> List[str]:
    """Clean Instagram carousel slides and ensure proper formatting"""
    cleaned_slides = []
    for slide in slides:
        cleaned = clean_text(slide)
        
        # Remove any JSON artifacts
        cleaned = re.sub(r'^```json\s*', '', cleaned)
        cleaned = re.sub(r'```\s*$', '', cleaned)
        cleaned = cleaned.strip('"').strip("'").strip()
        
        # Skip empty or JSON-like content
        if not cleaned or cleaned.startswith('{') or cleaned.startswith('[') or 'json' in cleaned.lower():
            continue
        
        # Ensure proper 2-line format with \n separator
        lines = cleaned.split('\n')
        if len(lines) >= 2:
            title = lines[0].strip()
            description = lines[1].strip()
        else:
            # Single line - try to split it intelligently
            single_line = cleaned.strip()
            words = single_line.split()
            
            # Look for emoji at start
            emoji_match = re.match(r'^([\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002600-\U000027BF\U0001F900-\U0001F9FF])', single_line)
            
            if emoji_match and len(words) > 3:
                emoji = emoji_match.group(1)
                remaining_text = single_line.replace(emoji, '').strip()
                remaining_words = remaining_text.split()
                
                # Split at a natural point (after 2-4 words for title)
                split_index = min(3, len(remaining_words) // 2 + 1)
                
                title_words = remaining_words[:split_index]
                desc_words = remaining_words[split_index:]
                
                title = f"{emoji} {' '.join(title_words).upper()}"
                description = ' '.join(desc_words).capitalize()
            else:
                # Fallback - use first part as title
                if len(words) > 4:
                    title_words = words[:3]
                    desc_words = words[3:]
                    title = f"💡 {' '.join(title_words).upper()}"
                    description = ' '.join(desc_words).capitalize()
                else:
                    title = f"💡 {cleaned.upper()}"
                    description = "Key insight here"
        
        # Clean up title - ensure it's short and properly formatted
        if len(title) > 25:
            emoji_match = re.match(r'^([\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002600-\U000027BF\U0001F900-\U0001F9FF])', title)
            emoji = emoji_match.group(1) if emoji_match else "💡"
            title_text = title.replace(emoji, "").strip()
            words = title_text.split()[:3]  # Max 3 words
            title = f"{emoji} {' '.join(words).upper()}"
        
        # Clean up description - ensure it's short and properly formatted
        if len(description) > 40:
            words = description.split()[:6]  # Max 6 words
            description = ' '.join(words)
        
        # Ensure description starts with capital letter
        if description and not description[0].isupper():
            description = description[0].upper() + description[1:]
        
        # IMPORTANT: Ensure proper line break between title and description
        formatted_slide = f"{title}\n{description}"
        cleaned_slides.append(formatted_slide)
    
    return cleaned_slides