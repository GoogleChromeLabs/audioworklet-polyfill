# AudioWorklet Polyfill

Polyfills [AudioWorklet] in browsers that don't support them, using ScriptProcessorNodes under the hood.

Worklets are invoked on the main thread within an isolated scope emulating that of a Worklet.

| [Demo #1](https://googlechromelabs.github.io/audioworklet-polyfill/) | [Demo #2](https://audio-dsp-playground-polyfilled.surge.sh) |
|-|-|

## Usage

```html
<script src="audioworklet-polyfill.js"></script>
<!-- or: -->
<script src="https://unpkg.com/audioworklet-polyfill/dist/audioworklet-polyfill.js"></script>
```

Or with a bundler:

```js
import 'audioworklet-polyfill';
```

... or with ES Modules on the web:

```js
import('https://unpkg.com/audioworklet-polyfill/dist/audioworklet-polyfill.js');
```

## Roadmap

- Improve support for custom parameters

## Similar Libraries

[@jariseon](https://github.com/jariseon) has implemented [a similar polyfill](https://github.com/jariseon/audioworklet-polyfill) that uses Web Workers for audio processing.

## License

[Apache 2.0](LICENSE)

[AudioWorklets]: https://googlechromelabs.github.io/web-audio-samples/audio-worklet/
