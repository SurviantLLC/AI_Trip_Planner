import * as fs from 'fs';

// Create a debug log function that writes to a file
function debugLog(message: string): void {
  fs.appendFileSync('debug.log', message + '\n');
}

try {
  debugLog('Starting debug test...');
  
  // Try to import the OpenAI service
  debugLog('Attempting to import OpenAI service...');
  
  try {
    const openAIService = require('./src/features/chat/services/openai.service');
    debugLog('Import succeeded. Type: ' + typeof openAIService);
    debugLog('Has default? ' + (openAIService.default ? 'Yes' : 'No'));
    
    const service = openAIService.default || openAIService;
    debugLog('Service type: ' + typeof service);
    
    if (service) {
      debugLog('Keys: ' + Object.keys(service).join(', '));
      debugLog('generateResponse exists? ' + (typeof service.generateResponse === 'function'));
    } else {
      debugLog('Service is null or undefined');
    }
  } catch (importError) {
    debugLog('Import ERROR: ' + (importError as Error).message);
    debugLog('Stack: ' + (importError as Error).stack);
  }
  
  // Check if the original file exists
  try {
    const filePath = './src/features/chat/services/openai.service.ts';
    const exists = fs.existsSync(filePath);
    debugLog('File exists? ' + exists);
    
    if (exists) {
      const stats = fs.statSync(filePath);
      debugLog('File size: ' + stats.size);
    }
  } catch (fileError) {
    debugLog('File check ERROR: ' + (fileError as Error).message);
  }
  
  debugLog('Debug test complete.');
} catch (error) {
  debugLog('FATAL ERROR: ' + (error as Error).message);
}
