try {
  console.log('Starting OpenAI service test...');
  
  console.log('Attempting to import openAIService...');
  const openAIServiceModule = require('./src/features/chat/services/openai.service');
  
  console.log('Import result:', openAIServiceModule);
  
  // Check what we got from the import
  console.log('typeof import result:', typeof openAIServiceModule);
  
  // Extract the default export if it exists
  const openAIService = openAIServiceModule.default || openAIServiceModule;
  
  console.log('OpenAI Service:', openAIService);
  console.log('typeof OpenAI Service:', typeof openAIService);
  
  if (openAIService) {
    console.log('Service accessed successfully!');
    console.log('Service keys:', Object.keys(openAIService));
    
    // Check methods
    console.log('generateResponse exists?', typeof openAIService.generateResponse === 'function');
    console.log('detectTravelIntent exists?', typeof openAIService.detectTravelIntent === 'function');
    
    // Try to access the constructor
    if (openAIService.constructor) {
      console.log('Constructor name:', openAIService.constructor.name);
    }
  } else {
    console.log('ERROR: openAIService is falsy!');
  }
} catch (error) {
  console.error('ERROR during test:');
  console.error(error);
}
