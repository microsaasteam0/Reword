import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface FormattedTextProps {
  text: string
  className?: string
  type?: 'tweet' | 'linkedin' | 'instagram' | 'default'
}

export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = '',
  type = 'default'
}) => {
  // Get the appropriate CSS class based on type
  const getTypeClass = () => {
    switch (type) {
      case 'tweet':
        return 'tweet-text'
      case 'linkedin':
        return 'linkedin-text'
      case 'instagram':
        return 'instagram-text'
      default:
        return 'formatted-text'
    }
  }

  return (
    <div className={`${getTypeClass()} ${className}`}>
      {text}
    </div>
  )
}

interface XDisplayProps {
  tweets: string[]
  onCopy: (text: string, key: string) => void
  copiedStates: { [key: string]: boolean }
  onSave?: () => void
}

export const XDisplay: React.FC<XDisplayProps> = ({ tweets, onCopy, copiedStates, onSave }) => {
  const [currentTweet, setCurrentTweet] = useState(0)

  const nextTweet = () => {
    setCurrentTweet((prev) => (prev + 1) % tweets.length)
  }

  const prevTweet = () => {
    setCurrentTweet((prev) => (prev - 1 + tweets.length) % tweets.length)
  }

  const goToTweet = (index: number) => {
    setCurrentTweet(index)
  }

  const copyAllTweets = () => {
    const allTweetsText = tweets.map((tweet, index) => `${index + 1}. ${tweet}`).join('\n\n')
    onCopy(allTweetsText, 'x-all')
  }

  const formatTweetContent = (tweet: string) => {
    // Split content and hashtags for better display
    const hashtagMatch = tweet.match(/(.*?)(#\w+(?:\s+#\w+)*)$/)
    if (hashtagMatch) {
      const [, mainContent, hashtags] = hashtagMatch
      return (
        <>
          <div className="mb-2">{mainContent.trim()}</div>
          <div className="text-blue-400 font-medium text-sm">
            {hashtags.trim()}
          </div>
        </>
      )
    }
    return tweet
  }

  return (
    <div className="bg-black text-white rounded-2xl shadow-lg overflow-hidden max-w-lg mx-auto border border-gray-800">
      {/* X Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-white">Your Brand</div>
            <div className="text-gray-400 text-sm">@yourbrand</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1.5 hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Thread Navigation */}
      {tweets.length > 1 && (
        <div className="px-4 py-2 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={prevTweet}
                disabled={currentTweet === 0}
                className="p-1 hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex space-x-1">
                {tweets.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTweet(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${index === currentTweet ? 'bg-blue-400' : 'bg-gray-600'
                      }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTweet}
                disabled={currentTweet === tweets.length - 1}
                className="p-1 hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="text-xs text-gray-400">
              {currentTweet + 1} of {tweets.length}
            </div>
          </div>
        </div>
      )}

      {/* Current Tweet Content */}
      <div className="p-4">
        <div className="text-white leading-relaxed text-[15px] mb-4">
          {formatTweetContent(tweets[currentTweet])}
        </div>

        <div className="text-gray-400 text-sm mb-4">
          2:34 PM · Dec 15, 2026 · <span className="text-blue-400">Web App</span>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex items-center space-x-6 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-white">1,234</span>
            <span>Views</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-bold text-white">89</span>
            <span>Reposts</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-bold text-white">156</span>
            <span>Likes</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-bold text-white">23</span>
            <span>Bookmarks</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around py-3 border-t border-gray-800">
        <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-900 rounded-full transition-colors group">
          <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm text-gray-500 group-hover:text-blue-400">Reply</span>
        </button>

        <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-900 rounded-full transition-colors group">
          <svg className="w-5 h-5 text-gray-500 group-hover:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm text-gray-500 group-hover:text-green-400">Repost</span>
        </button>

        <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-900 rounded-full transition-colors group">
          <svg className="w-5 h-5 text-gray-500 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm text-gray-500 group-hover:text-red-400">Like</span>
        </button>

        <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-900 rounded-full transition-colors group">
          <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-sm text-gray-500 group-hover:text-blue-400">Bookmark</span>
        </button>

        <button
          onClick={() => onCopy(tweets[currentTweet], `tweet-${currentTweet}`)}
          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-900 rounded-full transition-colors group"
        >
          {copiedStates[`tweet-${currentTweet}`] ? (
            <>
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-400">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm text-gray-500 group-hover:text-blue-400">Share</span>
            </>
          )}
        </button>
      </div>

      {/* Save Button Section - Separate and More Visible */}
      {onSave ? (
        <div className="border-t border-gray-800 p-3">
          <button
            onClick={onSave}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg transition-colors text-sm font-medium"
            title="Save this Twitter thread to your account"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Save Twitter Thread</span>
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-800 p-3">
          <div className="text-center py-2">
            <p className="text-gray-400 text-sm mb-2">💾 Want to save this thread?</p>
            <p className="text-gray-500 text-xs">Sign in to save content to your dashboard</p>
          </div>
        </div>
      )}

      {/* Copy All Button */}
      <div className="border-t border-gray-800 p-3">
        <button
          onClick={copyAllTweets}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors text-sm font-bold"
        >
          {copiedStates['x-all'] ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied All Posts!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy All {tweets.length} Posts</span>
            </>
          )}
        </button>
      </div>

      {/* Post Stats */}
      <div className="text-center py-2 bg-gray-900 text-xs text-gray-500">
        Post {currentTweet + 1} of {tweets.length} • {tweets[currentTweet]?.length || 0}/280 characters
      </div>
    </div>
  )
}

interface LinkedInDisplayProps {
  post: string
  onCopy: (text: string, key: string) => void
  copied: boolean
  onSave?: () => void
}

export const LinkedInDisplay: React.FC<LinkedInDisplayProps> = ({ post, onCopy, copied, onSave }) => {
  // More aggressive formatting for LinkedIn posts
  const formatLinkedInPost = (text: string) => {
    // Simplify formatting to honor LLM spacing
    // We use whitespace-pre-wrap on the container, so we just need to handle highlighting
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Handle hashtags
      if (line.includes('#')) {
        const parts = line.split(/(#\w+)/g);
        return (
          <div key={index} className="min-h-[1em]">
            {parts.map((part, pIndex) =>
              part.startsWith('#') ? (
                <span key={pIndex} className="text-blue-400 font-medium">{part}</span>
              ) : (
                <span key={pIndex}>{part}</span>
              )
            )}
          </div>
        );
      }

      // Handle Bold/Hook lines (starting with emoji)
      const isHook = line.trim().match(/^[💡🚀🎯✨💪🔥⚡]/);

      return (
        <div
          key={index}
          className={`min-h-[1em] ${isHook ? 'text-white font-bold text-base' : 'text-gray-300 text-sm'}`}
        >
          {line}
        </div>
      );
    });
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-sm overflow-hidden max-w-lg mx-auto">
      {/* LinkedIn Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">YB</span>
          </div>
          <div>
            <div className="font-semibold text-sm text-white">Your Brand</div>
            <div className="text-xs text-gray-400">Marketing Professional • 2nd</div>
            <div className="text-xs text-gray-500">2h • 🌍</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-gray-800 rounded">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          <button className="p-1 hover:bg-gray-800 rounded">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <div className="text-gray-200 whitespace-pre-wrap">
          {formatLinkedInPost(post)}
        </div>
      </div>

      {/* LinkedIn Actions */}
      <div className="border-t border-gray-700">
        {/* Reaction Summary */}
        <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">👍</span>
              </div>
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">❤️</span>
              </div>
              <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">💡</span>
              </div>
            </div>
            <span>127</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>23 comments</span>
            <span>8 reposts</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-around py-2 border-t border-gray-700">
          <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded transition-colors flex-1 justify-center group">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span className="text-sm font-medium text-gray-300 group-hover:text-blue-400">Like</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded transition-colors flex-1 justify-center group">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium text-gray-300 group-hover:text-blue-400">Comment</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded transition-colors flex-1 justify-center group">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium text-gray-300 group-hover:text-green-400">Repost</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded transition-colors flex-1 justify-center group">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span className="text-sm font-medium text-gray-300 group-hover:text-blue-400">Send</span>
          </button>
        </div>
      </div>

      {/* Copy and Save Buttons */}
      <div className="border-t border-gray-700 p-3 space-y-2">
        <button
          onClick={() => onCopy(post, 'linkedin')}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied Post!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy LinkedIn Post</span>
            </>
          )}
        </button>

        {/* Save Button - More Prominent */}
        {onSave && (
          <button
            onClick={onSave}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg transition-colors text-sm font-medium"
            title="Save this LinkedIn post to your account"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Save LinkedIn Post</span>
          </button>
        )}
      </div>

      {/* Post Stats */}
      <div className="text-center py-2 bg-gray-800 text-xs text-gray-400">
        {post.length} characters • Professional post format
      </div>
    </div>
  )
}

interface InstagramCarouselProps {
  slides: string[]
  onCopy: (text: string, key: string) => void
  copiedStates: { [key: string]: boolean }
  onSave?: () => void
}

export const InstagramCarousel: React.FC<InstagramCarouselProps> = ({ slides, onCopy, copiedStates, onSave }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Parse the slide content - prioritize \n line breaks from backend
  const parseSlide = (text: string) => {
    // First, try to split by \n (proper line breaks from backend)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '')

    if (lines.length >= 2) {
      return {
        title: lines[0],
        description: lines.slice(1).join(' ')
      }
    } else if (lines.length === 1) {
      // Single line - try to split intelligently as fallback
      const singleLine = lines[0]

      // Look for emoji at the start - simple check for common emojis
      const emojiMatch = singleLine.match(/^([💡🚀⚡🎯💪🧠⭐🔥🌟✨📋🎬🌍💖🌈📖👥🛠️📜💞📲])/)

      if (emojiMatch) {
        const withoutEmoji = singleLine.replace(emojiMatch[1], '').trim()
        const words = withoutEmoji.split(' ')

        if (words.length > 3) {
          // Find natural break point - look for uppercase words or after 2-3 words
          let splitIndex = 3

          for (let i = 2; i < Math.min(5, words.length); i++) {
            const currentTitle = words.slice(0, i).join(' ')
            if (currentTitle.length > 15 || words[i]?.length > 6) {
              splitIndex = i
              break
            }
          }

          const title = emojiMatch[1] + ' ' + words.slice(0, splitIndex).join(' ')
          const description = words.slice(splitIndex).join(' ')

          return { title, description }
        }
      }

      return { title: singleLine, description: '' }
    }

    return { title: text, description: '' }
  }

  const copyAllSlides = () => {
    const allSlidesText = slides.map((slide, index) => `Slide ${index + 1}\n${slide}`).join('\n\n')
    onCopy(allSlidesText, 'instagram-all')
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-sm overflow-hidden max-w-md mx-auto">
      {/* Instagram Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">YB</span>
          </div>
          <div>
            <div className="font-semibold text-sm text-white">yourbrand</div>
            <div className="text-xs text-gray-400">Sponsored</div>
          </div>
        </div>
        <button className="p-1">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Carousel Container */}
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 aspect-square">
        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
              />
            ))}
          </div>
        )}

        {/* Current Slide */}
        <div className="h-full flex items-center justify-center p-6 text-center">
          {(() => {
            const { title, description } = parseSlide(slides[currentSlide])
            return (
              <div className="space-y-3">
                <div className="text-xl font-bold text-white leading-tight">
                  {title}
                </div>
                {description && (
                  <div className="text-sm text-gray-300 leading-relaxed">
                    {description}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Copy Button for Current Slide */}
        <button
          onClick={() => onCopy(slides[currentSlide], `slide-${currentSlide}`)}
          className="absolute bottom-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
          title="Copy current slide"
        >
          {copiedStates[`slide-${currentSlide}`] ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Instagram Actions */}
      <div className="p-3">
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-red-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="text-gray-300 hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button className="text-gray-300 hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
          <button className="text-gray-300 hover:text-yellow-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Likes */}
        <div className="text-sm font-semibold text-white mb-1">
          1,234 likes
        </div>

        {/* Caption */}
        <div className="text-sm text-gray-300 mb-2">
          <span className="font-semibold text-white">yourbrand</span> Check out these amazing tips!
          <span className="text-pink-400"> #tips #growth #success</span>
        </div>

        {/* View Comments */}
        <button className="text-sm text-gray-400 mb-2 hover:text-gray-300 transition-colors">
          View all 42 comments
        </button>

        {/* Time */}
        <div className="text-xs text-gray-500 uppercase tracking-wide">
          2 hours ago
        </div>
      </div>

      {/* Copy All and Save Buttons */}
      <div className="border-t border-gray-700 p-3 space-y-2">
        <button
          onClick={copyAllSlides}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors text-sm font-medium"
        >
          {copiedStates['instagram-all'] ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied All Slides!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy All {slides.length} Slides</span>
            </>
          )}
        </button>

        {/* Save Button - More Prominent */}
        {onSave && (
          <button
            onClick={onSave}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg transition-colors text-sm font-medium"
            title="Save this Instagram carousel to your account"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Save Instagram Carousel</span>
          </button>
        )}
      </div>

      {/* Slide Counter */}
      <div className="text-center py-2 bg-gray-800 text-xs text-gray-400">
        Slide {currentSlide + 1} of {slides.length} • {slides[currentSlide]?.length || 0} characters
      </div>
    </div>
  )
}