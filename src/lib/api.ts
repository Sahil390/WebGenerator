const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD 
    ? '/api'  // Use relative path in production (Netlify)
    : 'http://localhost:3001/api'  // Use localhost in development
);

export interface GenerateWebsiteRequest {
  prompt: string;
}

export interface GenerateWebsiteResponse {
  success: boolean;
  data: {
    html: string;
    htmlOnly: string;
    cssOnly: string;
    jsOnly: string;
    title?: string;
    description?: string;
    prompt: string;
    generatedAt: string;
    isComplete?: boolean;
  };
  error?: string;
  details?: string;
}

export interface StepResponse {
  success: boolean;
  step: 'html' | 'styles' | 'functionality';
  data: {
    html: string;
    title?: string;
    description?: string;
    prompt: string;
    generatedAt: string;
    isComplete?: boolean;
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
      // Set a reasonable timeout for each step (30 seconds total)
      signal: AbortSignal.timeout(30000), // 30 seconds per step
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
          errorMessage = 'Internal server error. Please try again or contact support if the issue persists.';
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
    console.log('🚀 Starting three-step website generation process...');
    
    try {
      // Step 1: Generate HTML structure
      console.log('📄 Step 1: Generating HTML structure...');
      const htmlResponse = await this.request<StepResponse>('/generate-html', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!htmlResponse.success) {
        throw new Error(`HTML generation failed: ${htmlResponse.error}`);
      }
      
      console.log('✅ Step 1 completed: HTML structure generated');
      
      // Step 2: Add CSS styling
      console.log('🎨 Step 2: Adding CSS styling...');
      const stylesResponse = await this.request<StepResponse>('/generate-styles', {
        method: 'POST',
        body: JSON.stringify({
          prompt: data.prompt,
          html: htmlResponse.data.html,
          title: htmlResponse.data.title
        }),
      });
      
      if (!stylesResponse.success) {
        throw new Error(`CSS styling failed: ${stylesResponse.error}`);
      }
      
      console.log('✅ Step 2 completed: CSS styling added');
      
      // Step 3: Add JavaScript functionality
      console.log('⚡ Step 3: Adding JavaScript functionality...');
      const functionalityResponse = await this.request<StepResponse>('/generate-functionality', {
        method: 'POST',
        body: JSON.stringify({
          prompt: data.prompt,
          html: stylesResponse.data.html,
          title: stylesResponse.data.title,
          description: stylesResponse.data.description
        }),
      });
      
      if (!functionalityResponse.success) {
        throw new Error(`JavaScript functionality failed: ${functionalityResponse.error}`);
      }
      
      console.log('✅ Step 3 completed: JavaScript functionality added');
      console.log('🎉 Three-step website generation completed successfully!');
      
      // Extract separate components for compatibility
      const finalHtml = functionalityResponse.data.html;
      const htmlMatch = finalHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const cssMatch = finalHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const jsMatch = finalHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      
      return {
        success: true,
        data: {
          html: finalHtml,
          htmlOnly: htmlMatch ? htmlMatch[1] : '',
          cssOnly: cssMatch ? cssMatch[1] : '',
          jsOnly: jsMatch ? jsMatch[1] : '',
          title: functionalityResponse.data.title,
          description: functionalityResponse.data.description,
          prompt: data.prompt,
          generatedAt: functionalityResponse.data.generatedAt,
          isComplete: true
        }
      };
      
    } catch (error) {
      console.error('💥 Three-step generation failed:', error);
      throw error;
    }
  }

  // Fallback method using the original single function approach
  async generateWebsiteFallback(data: GenerateWebsiteRequest): Promise<GenerateWebsiteResponse> {
    console.log('🔄 Using fallback single-step generation...');
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