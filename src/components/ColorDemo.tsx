import React from 'react';

/**
 * Temporary demo component to test CSS custom properties integration
 * This component demonstrates both Tailwind classes and direct CSS variable usage
 */
const ColorDemo: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-neutral-800 font-display">
        CSS Custom Properties Demo
      </h2>
      
      {/* Test Tailwind color classes (should work as before) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary-600 text-white p-4 rounded-lg">
          <h3 className="font-semibold">Primary via Tailwind</h3>
          <p>bg-primary-600 class</p>
        </div>
        
        <div className="bg-secondary-500 text-white p-4 rounded-lg">
          <h3 className="font-semibold">Secondary via Tailwind</h3>
          <p>bg-secondary-500 class</p>
        </div>
      </div>
      
      {/* Test direct CSS variable usage */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          style={{ 
            backgroundColor: 'rgb(var(--color-success-600))',
            color: 'white'
          }}
          className="p-4 rounded-lg"
        >
          <h3 className="font-semibold">Success via CSS Variable</h3>
          <p>Direct --color-success-600 usage</p>
        </div>
        
        <div 
          style={{ 
            backgroundColor: 'rgb(var(--color-warning-600))',
            color: 'white'
          }}
          className="p-4 rounded-lg"
        >
          <h3 className="font-semibold">Warning via CSS Variable</h3>
          <p>Direct --color-warning-600 usage</p>
        </div>
      </div>
      
      {/* Test theme utility classes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="theme-bg-primary text-white p-4 rounded-lg">
          <h3 className="font-semibold">Theme Utility Class</h3>
          <p>.theme-bg-primary class</p>
        </div>
        
        <div className="bg-neutral-100 p-4 rounded-lg">
          <p className="theme-text-primary font-semibold">
            Theme Text Color
          </p>
          <p className="text-neutral-600">.theme-text-primary class</p>
        </div>
      </div>
      
      {/* Color palette display */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          Complete Color Palette
        </h3>
        
        <div className="grid grid-cols-11 gap-1 mb-4">
          <div className="text-xs text-neutral-600 font-medium">Primary:</div>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => (
            <div
              key={shade}
              className={`h-8 w-8 rounded bg-primary-${shade} border border-neutral-200`}
              title={`primary-${shade}`}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-11 gap-1 mb-4">
          <div className="text-xs text-neutral-600 font-medium">Success:</div>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => (
            <div
              key={shade}
              className={`h-8 w-8 rounded bg-success-${shade} border border-neutral-200`}
              title={`success-${shade}`}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-11 gap-1 mb-4">
          <div className="text-xs text-neutral-600 font-medium">Warning:</div>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => (
            <div
              key={shade}
              className={`h-8 w-8 rounded bg-warning-${shade} border border-neutral-200`}
              title={`warning-${shade}`}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-11 gap-1">
          <div className="text-xs text-neutral-600 font-medium">Error:</div>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => (
            <div
              key={shade}
              className={`h-8 w-8 rounded bg-error-${shade} border border-neutral-200`}
              title={`error-${shade}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorDemo; 