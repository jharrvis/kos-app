const MAYAR_API_BASE_URL = process.env.MAYAR_API_BASE_URL || 'https://api.mayar.id/hl/v1'
const MAYAR_API_KEY = process.env.MAYAR_API_KEY
const MAYAR_WEBHOOK_SECRET = process.env.MAYAR_WEBHOOK_SECRET

export interface CreateInvoiceParams {
  name: string
  email: string
  mobile: string
  redirectUrl: string
  description: string
  expiredAt: string
  items: Array<{
    quantity: number
    rate: number
    description: string
  }>
  extraData?: Record<string, any>
}

export interface InvoiceResponse {
  statusCode: number
  messages: string
  data: {
    id: string
    transactionId: string
    link: string
    expiredAt: number
    extraData?: Record<string, any>
  }
}

export interface WebhookPayload {
  event: {
    received: string
  }
  data: {
    id: string
    status: boolean
    createdAt: number
    updatedAt: number
    merchantId: string
    merchantEmail: string
    merchantName: string
    customerName: string
    customerEmail: string
    customerMobile: string
    amount: number
    isAdminFeeBorneByCustomer: boolean
    isChannelFeeBorneByCustomer: boolean
    productId: string
    productName: string
    productType: string
    pixelFbp?: string
    pixelFbc?: string
    addOn?: any[]
    custom_field?: any[]
  }
}

class MayarClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    if (!MAYAR_API_KEY) {
      throw new Error('MAYAR_API_KEY is required')
    }
    this.baseUrl = MAYAR_API_BASE_URL
    this.apiKey = MAYAR_API_KEY
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Mayar API error (${response.status}): ${error}`)
    }

    return response.json()
  }

  async createInvoice(params: CreateInvoiceParams): Promise<InvoiceResponse> {
    return this.request<InvoiceResponse>('/invoice/create', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getInvoiceDetail(invoiceId: string) {
    return this.request(`/invoice/detail/${invoiceId}`, {
      method: 'GET',
    })
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!MAYAR_WEBHOOK_SECRET) {
      console.warn('MAYAR_WEBHOOK_SECRET not configured, skipping signature verification')
      return true
    }

    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', MAYAR_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  }

  parseWebhook(payload: string): WebhookPayload {
    return JSON.parse(payload)
  }
}

export const mayarClient = typeof window === 'undefined' && MAYAR_API_KEY 
  ? new MayarClient() 
  : null as any
