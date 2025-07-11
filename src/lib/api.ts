const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'production'
    ? '/api'  // Use relative path in production (Netlify)
    : 'http://localhost:3001/api'  // Use localhost in development
);

console.log('🔧 Environment check:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  API_BASE_URL
});

export interface GenerateWebsiteRequest {
  prompt: string;
  userApiKey?: string;
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
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Set a reasonable timeout for the frontend request
      signal: AbortSignal.timeout(320000), // 5 min 20 sec (20 sec buffer over backend)
    };

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        
        // Create more descriptive error messages based on status and error type
        let errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        
        if (response.status === 502) {
          if (errorData.errorType === 'TimeoutError') {
            errorMessage = 'The AI is taking longer than expected to generate your website. This often happens with very detailed prompts or during high traffic. Please try again with a simpler description.';
          } else if (errorData.errorType === 'ServerBusyError') {
            errorMessage = 'The server is temporarily busy. Please wait 30 seconds and try again.';
          } else {
            errorMessage = 'The AI service is temporarily unavailable. Please try again in a few moments.';
          }
        } else if (response.status === 429) {
          errorMessage = 'The AI service is experiencing high demand. Please wait 30 seconds and try again.';
        } else if (response.status === 500) {
          // Check if it's a Google AI overloaded error
          if (errorData.error && errorData.error.includes('overloaded')) {
            errorMessage = 'The AI service is currently overloaded due to high demand. Please wait 30-60 seconds and try again. You might also try a shorter, simpler prompt.';
          } else {
            errorMessage = 'Internal server error. Please try again or contact support if the issue persists.';
          }
        } else if (response.status === 504) {
          errorMessage = 'The request took too long to complete. Please try again with a shorter, simpler description.';
        }
        
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).errorType = errorData.errorType;
        (error as any).details = errorData.details;
        throw error;
      }

      const data = await response.json();
      console.log('✅ API Success:', data);
      return data;
    } catch (error) {
      console.error('💥 API Request failed:', error);
      
      // Handle timeout errors specifically
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        const timeoutError = new Error('The request took too long to complete. Please try again with a shorter description.');
        (timeoutError as any).status = 504;
        (timeoutError as any).errorType = 'TimeoutError';
        throw timeoutError;
      }
      
      // Handle network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        const networkError = new Error('Network error. Please check your internet connection and try again.');
        (networkError as any).status = 502;
        (networkError as any).errorType = 'NetworkError';
        throw networkError;
      }
      
      throw error;
    }
  }

  async generateWebsite(data: GenerateWebsiteRequest): Promise<GenerateWebsiteResponse> {
    try {
      const headers: Record<string, string> = {};
      
      // If user provided their own API key, send it in headers
      if (data.userApiKey) {
        headers['X-User-API-Key'] = data.userApiKey;
      }
      
      return await this.request<GenerateWebsiteResponse>('/generate-website', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: data.prompt }),
      });
    } catch (error: any) {
      // Check if it's a connection error and provide helpful message
      if (error.message.includes('ERR_CONNECTION_REFUSED') || error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the AI service. Please make sure the backend server is running and properly configured with API keys.');
      }
      throw error;
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }
}

export const apiService = new ApiService();
export default apiService;