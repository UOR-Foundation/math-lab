import React, { useState, useEffect } from 'react';

/**
 * Main panel component for the basic plugin
 */
const MainPanel: React.FC<{ dashboard: any }> = ({ dashboard }) => {
  const [value, setValue] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    // You can use dashboard features here
    const unsubscribe = dashboard.events.subscribe('expression:evaluated', (data) => {
      // React to events
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [dashboard]);

  const handleCalculate = async () => {
    try {
      // Use the mathJs API through the dashboard
      const square = await dashboard.mathJs.evaluateExpression(`${value}^2`);
      setResult(square);
    } catch (error) {
      console.error('Calculation error:', error);
      dashboard.notifications.error('Failed to calculate square');
    }
  };

  return (
    <div className="basic-plugin-panel">
      <h2>Basic Plugin</h2>
      
      <div className="input-section">
        <label htmlFor="value-input">Enter a number:</label>
        <input
          id="value-input"
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <button onClick={handleCalculate}>Calculate Square</button>
      </div>
      
      {result !== null && (
        <div className="result-section">
          <h3>Result:</h3>
          <p className="result">{result}</p>
        </div>
      )}
      
      <div className="documentation-link">
        <a href="#" onClick={() => dashboard.openDocumentation('basic-plugin')}>
          View Documentation
        </a>
      </div>
    </div>
  );
};

export default MainPanel;