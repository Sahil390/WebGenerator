const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface GenerateWebsiteRequest {
  prompt: string;
}

export interface GenerateWebsiteResponse {
  success: boolean;
  data: {
    html: string;
    title: string;
    description: string;
    prompt: string;
    generatedAt: string;
  };
  error?: string;
  details?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    console.log('🔧 API Service initialized with baseURL:', this.baseURL);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🌐 Making API request to:', url);
    console.log('📤 Request options:', options);
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
      });

      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Success:', data);
      return data;
    } catch (error) {
      console.error('💥 API Request failed:', error);
      throw error;
    }
  }

  async generateWebsite(data: GenerateWebsiteRequest): Promise<GenerateWebsiteResponse> {
    return this.request<GenerateWebsiteResponse>('/generate-website', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }
}

export const apiService = new ApiService();
export default apiService;