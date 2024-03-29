import { createConfidenceServerProvider } from '@spotify-confidence/openfeature-server-provider';
import { OpenFeature } from '@openfeature/server-sdk';

const provider = createConfidenceServerProvider({
  clientSecret: 'RxDVTrXvc6op1XxiQ4OaR31dKbJ39aYV',
  fetchImplementation: fetch,
  timeout: 1000,
});

OpenFeature.setProvider(provider);

const client = OpenFeature.getClient();

client
  .getBooleanValue('web-sdk-e2e-flag.bool', false, {
    targetingKey: `user-${Math.random()}`,
  })
  .then(result => {
    console.log('result:', result);
  });
