<p align="center">
  <img src="https://i.imgur.com/RqW6b4o.png" width="200" height="200" alt="AudioWorklet Polyfill">
  <h1 align="center">
  	AudioWorklet Polyfill
	<a href="https://www.npmjs.org/package/audioworklet-polyfill"><img src="https://img.shields.io/npm/v/audioworklet-polyfill.svg?style=flat" alt="npm"></a>
  </h1>
</p>

Polyfills [AudioWorklet] in browsers that don't support it, using ScriptProcessorNodes under the hood.

Worklets are invoked on the main thread within an isolated scope emulating that of a Worklet.

| [Basic Demo](https://googlechromelabs.github.io/audioworklet-polyfill/) | [DSP Playground Demo](https://audio-dsp-playground-polyfilled.surge.sh) |
|-|-|

> New to AudioWorklet? Check out this great [Introduction and Demos](https://developers.google.com/web/updates/2017/12/audio-worklet).

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

[AudioWorklet]: https://googlechromelabs.github.io/web-audio-samples/audio-worklet/
