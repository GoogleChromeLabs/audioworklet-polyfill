<p align="center">
  <img src="https://i.imgur.com/RqW6b4o.png" width="200" height="200" alt="AudioWorklet Polyfill">
  <h1 align="center">
  	AudioWorklet Polyfill
	<a href="https://www.npmjs.org/package/audioworklet-polyfill"><img src="https://img.shields.io/npm/v/audioworklet-polyfill.svg?style=flat" alt="npm"></a>
  </h1>
</p>

> #### 1kB polyfill for [AudioWorklet].

`audioworklet-polyfill` brings AudioWorklet support to all major browsers: Chrome, Firefox, Safari and Edge. It uses ScriptProcessorNode under the hood, and runs your Worklet code on the main thread in an isolated scope.

| [Basic Demo](https://googlechromelabs.github.io/audioworklet-polyfill/) | [DSP Playground Demo](https://audio-dsp-playground-polyfilled.surge.sh) |
|-|-|

> **New to AudioWorklet?** Check out this great [Introduction and Demos](https://developers.google.com/web/updates/2017/12/audio-worklet) or the [AudioWorklet Examples].

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

## Why are Worklets emulated on the main thread?

This polyfill is intended to be a bridging solution until AudioWorklet is implemented across all browsers. It's an improvement over ScriptProcessorNode even though that's what it uses under the hood, because code written using this polyfill is forwards-compatible: as native support improves, your application improves. This polyfill offers a simple, future-proof alternative to ScriptProcessorNode without introducing Workers or relying on shared memory.

## Similar Libraries

[@jariseon](https://github.com/jariseon) has implemented [a similar polyfill](https://github.com/jariseon/audioworklet-polyfill) that uses Web Workers for audio processing.

## License

[Apache 2.0](LICENSE)

[AudioWorklet]: https://webaudio.github.io/web-audio-api/#AudioWorklet
[AudioWorklet Examples]: https://googlechromelabs.github.io/web-audio-samples/audio-worklet/
