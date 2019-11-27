import React, {useEffect, useState} from 'react';

export default function App() {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCounter((count) => count + 1), 1_000);
    return () => clearInterval(interval);
  });

  return <div>Hello world! {counter}</div>;
}
