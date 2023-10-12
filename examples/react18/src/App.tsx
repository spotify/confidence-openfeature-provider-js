import React, { useEffect } from 'react';
import { OpenFeature } from '@openfeature/web-sdk';
import TestComponent from './TestComponent';
import { createConfidenceWebProvider } from '@spotify-confidence/openfeature-web-provider';

export const webProvider = createConfidenceWebProvider({
  clientSecret: 'RxDVTrXvc6op1XxiQ4OaR31dKbJ39aYV',
  region: 'eu',
  fetchImplementation: window.fetch.bind(window),
  apply: {
    timeout: 1000,
  },
});

function App() {
  useEffect(() => {
    OpenFeature.setContext({
      targetingKey: 'user-a',
    }).then(() => {
      OpenFeature.setProvider(webProvider);
    });
  }, []);

  return (
    <>
      <h1>React 18 Example</h1>
      <React.Suspense fallback={<p>Loading... </p>}>
        <TestComponent />
      </React.Suspense>
    </>
  );
}

export default App;
