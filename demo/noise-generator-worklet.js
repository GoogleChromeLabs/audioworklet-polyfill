// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * A noise generator example with a gain AudioParam.
 *
 * @class NoiseGenerator
 * @extends AudioWorkletProcessor
 */
class NoiseGenerator extends AudioWorkletProcessor {
  static get parameterDescriptors () {
    return [{ name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 }];
  }

  // constructor (options) {
  //   super();
  //   console.log('options: ', options);
  //   console.log(this.port);
  // }

  process (inputs, outputs, parameters) {
    const output = outputs[0];
    const amplitude = parameters.amplitude;
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] = 2 * (Math.random() - 0.5) * amplitude[i];
      }
    }

    return true;
  }
}

registerProcessor('noise-generator', NoiseGenerator);
