# OpenFeature Web SDK React Integration

![](https://img.shields.io/badge/lifecycle-beta-a0c3d2.svg)

This is a helper package to use `OpenFeature` in React and ReactNative. It is not official OpenFeature and relies on behaviour from
the ConfidenceWebProvider specifically.

# Usage

## Adding the dependencies

To add the packages to your dependencies run:

```sh
yarn add @openfeature/web-sdk @spotify-confidence/openfeature-web-provider @spotify-confidence/integration-react
```

## Enabling the provider, setting the evaluation context and resolving flags in React

`setProvider` makes the Provider launch a network request to initialize the flags. In cases of success the `ProviderEvents.Ready`
event will be emitted. In cases of failure of the network request, the `ProviderEvent.Error` event will be emitted. The
ProviderEvents events will be emitted only when we are done with the network request, either a successful or a failed
network response. If the network response failed, default values will be returned on flag evaluation, if the network
request is successful we update the flags and then emit `ProviderEvents.Ready`.

```tsx
import React, { useEffect } from 'react';
import { createConfidenceWebProvider } from '@spotify-confidence/openfeature-web-provider';
import { OpenFeature, OpenFeatureAPI } from '@openfeature/web-sdk';
import { useStringValue } from '@spotify-confidence/integration-react';

const provider = createConfidenceWebProvider({
  clientSecret: 'mysecret',
  region: 'eu',
  fetchImplementation: window.fetch.bind(window),
});
OpenFeature.setProvider(provider);

const App = () => {
  useEffect(() => {
    OpenFeature.setContext({
      targetingKey: 'myTargetingKey',
    });
  }, []);

  return (
    <React.Suspense fallback={<Loading />}>
      <InnerComponent />
    </React.Suspense>
  );
};

function InnerComponent() {
  const str = useStringValue('flag.some-string', 'default');

  return <p>{str}</p>;
}
```

## Using a custom client

To use a custom client you can wrap your components in the `OpenFeatureContextProvider` component.

```tsx
import { OpenFeatureContextProvider } from '@spotify-confidence/integration-react';

const App = () => {
  return (
    <OpenFeatureContextProvider name={'my-client-name'}>
      <React.Suspense fallback={<Loading />}>
        <InnerComponent />
      </React.Suspense>
    </OpenFeatureContextProvider>
  );
};
```

Notes:

- `React.Suspense` is used to show users a loading state whilst the flags are pending, to limit flickering experiences for users.
- If the context is changed after a render, the app will not refresh until the resolve is complete, the web page will only update once, with the new flag values.

## Hooks

### useStringValue

```ts
import { useStringValue } from '@spotify-confidence/integration-react';

const str: string = useStringValue('flagKey', 'default');
```

### useStringDetails

```ts
import { useStringDetails } from '@spotify-confidence/integration-react';
import { ResolutionDetails } from '@openfeature/web-sdk';

const details: ResolutionDetails<string> = useStringDetails('flagKey', 'default');
```

### useNumberValue

```ts
import { useNumberValue } from '@spotify-confidence/integration-react';

const num: number = useNumberValue('flagKey', 0);
```

### useNumberDetails

```ts
import { useNumberDetails } from '@spotify-confidence/integration-react';
import { ResolutionDetails } from '@openfeature/web-sdk';

const details: ResolutionDetails<number> = useNumberDetails('flagKey', 0);
```

### useBooleanValue

```ts
import { useBooleanValue } from '@spotify-confidence/integration-react';

const bool: boolean = useBooleanValue('flagKey', false);
```

### useBooleanDetails

```ts
import { useBooleanDetails } from '@spotify-confidence/integration-react';
import { ResolutionDetails } from '@openfeature/web-sdk';

const details: ResolutionDetails<boolean> = useBooleanDetails('flagKey', false);
```

### useObjectValue

```ts
import { useObjectValue } from '@spotify-confidence/integration-react';

const struct: { val: string } = useObjectValue('flagKey', { val: 'default' });
```

### useObjectDetails

```ts
import { useObjectDetails } from '@spotify-confidence/integration-react';
import { ResolutionDetails } from '@openfeature/web-sdk';

const details: ResolutionDetails<{ val: string }> = useObjectDetails('flagKey', { val: 'default' });
```
