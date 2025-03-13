{steps.length > 0 && (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Steps ({steps.length})</h2>
      
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className="border border-gray-200 rounded-md p-4 relative"
          >
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={() => moveStep(index, 'up')}
                disabled={index === 0}
                className={`p-1 rounded ${
                  index === 0 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Move up"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => moveStep(index, 'down')}
                disabled={index === steps.length - 1}
                className={`p-1 rounded ${
                  index === steps.length - 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Move down"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => editStep(index)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit step"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={() => removeStep(index)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Remove step"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <h3 className="text-lg font-medium mb-4 pr-24">
              Step {index + 1}: {step.title}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Key Points</h4>
                  <p className="text-gray-800 whitespace-pre-line">{step.description}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Symbol</h4>
                  <div className="flex items-center">
                    {step.symbolType === 'quality' && (
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    )}
                    {step.symbolType === 'correctness' && (
                      <div className="w-4 h-4 bg-black rounded-full mr-2"></div>
                    )}
                    {step.symbolType === 'tip' && (
                      <span className="mr-2">✓</span>
                    )}
                    {step.symbolType === 'hazard' && (
                      <div className="w-4 h-4 bg-green-500 flex items-center justify-center mr-2">
                        <span className="text-white text-xs">+</span>
                      </div>
                    )}
                    <span>{step.symbolType || 'quality'}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Reasons Why</h4>
                  <p className="text-gray-800 whitespace-pre-line">{step.reasonWhy || 'Ensure quality'}</p>
                </div>
              </div>
              
              {step.imageUrl && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Reference Image</h4>
                  <img 
                    src={step.imageUrl} 
                    alt={`Step ${index + 1}`} 
                    className="w-full h-auto max-h-64 object-contain border border-gray-200 rounded-md p-1"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}