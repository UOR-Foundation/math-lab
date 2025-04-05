import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Math Lab</h1>
      <p>
        Official reference implementation dashboard for the UOR Foundation's math-js library
      </p>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;