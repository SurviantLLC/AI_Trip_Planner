"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
class OpenAIService {
    constructor() {
        // Initialize OpenAI client with API key from environment variables
        this.client = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        if (!process.env.OPENAI_API_KEY) {
            console.warn('WARNING: OPENAI_API_KEY is not set in environment variables');
        }
        else {
            console.log('OpenAI service initialized');
        }
    }
    /**
     * Generate an AI response based on conversation history
     *
     * @param messages Array of conversation messages with role and content
     * @returns AI generated response text
     */
    async generateResponse(messages) {
        try {
            // Add system message to guide the AI as a travel assistant
            const formattedMessages = [
                {
                    role: 'system',
                    content: 'You are an intelligent travel assistant. Help users plan trips, find flights, hotels, and attractions, and answer travel-related questions. Be friendly, helpful, and concise. If asked about non-travel topics, gently steer the conversation back to travel planning.'
                },
                ...messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }))
            ];
            // Call OpenAI API
            const completion = await this.client.chat.completions.create({
                model: 'gpt-4o', // Use appropriate model based on your needs
                messages: formattedMessages,
                max_tokens: 500
            });
            // Return the generated text
            return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response at this time.';
        }
        catch (error) {
            console.error('Error generating OpenAI response:', error?.message || error);
            return 'Sorry, I encountered an error while processing your request. Please try again later.';
        }
    }
}
exports.default = new OpenAIService();
