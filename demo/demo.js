/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/* eslint-disable */

// Copied verbatim from houdini-samples:
// https://developers.google.com/web/updates/2017/12/audio-worklet#background_scriptprocessornode

window.AudioContext = window.AudioContext || window.webkitAudioContext;

document.getElementById('play').onclick = function() {
	var context = new AudioContext();

	// Inject a tiny tranpiler to make IE11+ behave nicely:
	try {
		eval('class F {}');
	} catch (e) {
		context.audioWorklet.transpile = window.transpilerLite;
	}

	context.audioWorklet.addModule('noise-generator-worklet.js').then(() => {
		let modulator = context.createOscillator();
		let modGain = context.createGain();
		let noiseGenerator = new AudioWorkletNode(context, 'noise-generator');
		noiseGenerator.connect(context.destination);
		let paramAmp = noiseGenerator.parameters.get('amplitude');
		modulator.connect(modGain).connect(paramAmp);
		modulator.frequency.value = 0.5;
		modGain.gain.value = 0.75;
		modulator.start();
	});
	
	/*
	// Loads module script via AudioWorklet.
	context.audioWorklet.addModule('demo-worklet.js').then(() => {
		var oscillator = context.createOscillator();

		// After the resolution of module loading, an AudioWorkletNode can be constructed.
		var demoNode = new AudioWorkletNode(context, 'demo');

		// AudioWorkletNode can be interoperable with other native AudioNodes.
		oscillator.connect(demoNode).connect(context.destination);
		oscillator.start();
	});
	*/
}
