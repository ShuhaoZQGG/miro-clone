import DOMPurify from 'dompurify'

export interface SecurityConfig {
  maxTextLength: number
  maxImageSize: number
  allowedImageTypes: string[]
  enableSanitization: boolean
  rateLimits: {
    wsMessages: number
    apiCalls: number
    windowMs: number
  }
}

export class SecurityManager {
  private config: SecurityConfig
  private messageCount: Map<string, number>
  private resetInterval: NodeJS.Timeout | null = null

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      maxTextLength: 10000,
      maxImageSize: 10 * 1024 * 1024, // 10MB
      allowedImageTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'],
      enableSanitization: true,
      rateLimits: {
        wsMessages: 100,
        apiCalls: 50,
        windowMs: 60000 // 1 minute
      },
      ...config
    }

    this.messageCount = new Map()
    this.startRateLimitReset()
  }

  private startRateLimitReset() {
    this.resetInterval = setInterval(() => {
      this.messageCount.clear()
    }, this.config.rateLimits.windowMs)
  }

  sanitizeText(text: string): string {
    if (!this.config.enableSanitization) return text

    // Truncate if too long
    if (text.length > this.config.maxTextLength) {
      text = text.substring(0, this.config.maxTextLength)
    }

    // Sanitize HTML
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    })
  }

  sanitizeHTML(html: string): string {
    if (!this.config.enableSanitization) return html

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span', 'div'],
      ALLOWED_ATTR: ['style', 'class'],
      ALLOWED_STYLES: {
        'color': true,
        'background-color': true,
        'font-size': true,
        'font-weight': true,
        'text-align': true
      }
    })
  }

  validateImageUpload(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.config.allowedImageTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${this.config.allowedImageTypes.join(', ')}`
      }
    }

    // Check file size
    if (file.size > this.config.maxImageSize) {
      const maxSizeMB = this.config.maxImageSize / (1024 * 1024)
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSizeMB}MB`
      }
    }

    return { valid: true }
  }

  checkRateLimit(userId: string, type: 'ws' | 'api'): { allowed: boolean; remaining: number } {
    const key = `${userId}:${type}`
    const count = this.messageCount.get(key) || 0
    const limit = type === 'ws' ? this.config.rateLimits.wsMessages : this.config.rateLimits.apiCalls

    if (count >= limit) {
      return { allowed: false, remaining: 0 }
    }

    this.messageCount.set(key, count + 1)
    return { allowed: true, remaining: limit - count - 1 }
  }

  sanitizeWebSocketMessage(message: any): any {
    if (typeof message !== 'object' || message === null) {
      return message
    }

    const sanitized = { ...message }

    // Sanitize text fields
    if (sanitized.type === 'chat' && sanitized.content) {
      sanitized.content = this.sanitizeText(sanitized.content)
    }

    if (sanitized.type === 'element-update' && sanitized.data) {
      if (sanitized.data.text) {
        sanitized.data.text = this.sanitizeText(sanitized.data.text)
      }
      if (sanitized.data.content) {
        sanitized.data.content = this.sanitizeHTML(sanitized.data.content)
      }
    }

    // Validate data size
    const messageSize = JSON.stringify(sanitized).length
    if (messageSize > 64 * 1024) { // 64KB limit
      throw new Error('Message size exceeds limit')
    }

    return sanitized
  }

  validateUserInput(input: string, type: 'text' | 'url' | 'email'): { valid: boolean; sanitized: string } {
    let sanitized = this.sanitizeText(input)

    switch (type) {
      case 'url':
        try {
          const url = new URL(sanitized)
          if (!['http:', 'https:'].includes(url.protocol)) {
            return { valid: false, sanitized: '' }
          }
          return { valid: true, sanitized: url.toString() }
        } catch {
          return { valid: false, sanitized: '' }
        }

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(sanitized)) {
          return { valid: false, sanitized: '' }
        }
        return { valid: true, sanitized }

      default:
        return { valid: true, sanitized }
    }
  }

  generateCSRFToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  verifyCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken && token.length === 64
  }

  destroy() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval)
    }
    this.messageCount.clear()
  }
}