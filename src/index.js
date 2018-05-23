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

import { Realm } from './realm';

if (typeof AudioWorkletNode !== 'function') {
  window.AudioWorkletNode = function AudioWorkletNode (context, name) {
    const processor = getProcessorsForContext(context)[name];

    this.parameters = new Map();
    if (processor.properties) {
      for (let i = 0; i < processor.properties.length; i++) {
        const prop = processor.properties[i];
        const node = context.createGain().gain;
        node.value = prop.defaultValue;
        // @TODO there's no good way to construct the proxy AudioParam here
        this.parameters.set(prop.name, node);
      }
    }

    const inst = new processor.Processor({});

    this.port = processor.port;
    const scriptProcessor = context.createScriptProcessor();
    scriptProcessor.node = this;
    scriptProcessor.processor = processor;
    scriptProcessor.instance = inst;
    scriptProcessor.onaudioprocess = onAudioProcess;
    Object.defineProperty(this, '$$node', { value: scriptProcessor });
  };

  Object.defineProperties(window.AudioWorkletNode.prototype = Object.create(AudioNode.prototype), {
    bufferSize: {
      get () {
        return this.$$node.bufferSize;
      }
    },
    connect: { value (to) {
      return this.$$node.connect(to);
    } },
    disconnect: { value () {
      return this.$$node.disconnect();
    } }
  });

  Object.defineProperty(AudioContext.prototype, 'audioWorklet', {
    get () {
      return this.$$audioWorklet || (this.$$audioWorklet = new window.AudioWorklet(this));
    }
  });

  window.AudioWorklet = class AudioWorklet {
    constructor (audioContext) {
      this.$$context = audioContext;
    }

    addModule (url, options) {
      return fetch(url).then(r => {
        if (!r.ok) throw Error(r.status);
        return r.text();
      }).then(code => {
        const mc = new MessageChannel();
        const context = {
          sampleRate: 0,
          currentTime: 0,
          AudioWorkletProcessor () { },
          registerProcessor: (name, Processor) => {
            const processors = getProcessorsForContext(this.$$context);
            processors[name] = {
              port: mc.port1,
              context,
              Processor,
              properties: Processor.parameterDescriptors || []
            };
          },
          postMessage (e) { mc.port2.postMessage(e); },
          addEventListener (type, fn) { mc.port2.addEventListener(type, fn); },
          removeEventListener (type, fn) { mc.port2.addEventListener(type, fn); }
        };
        Object.defineProperty(context, 'onmessage', {
          get () { return mc.port2.onmessage; },
          set (f) { mc.port2.onmessage = f; }
        });
        context.self = context;
        const realm = new Realm(context, document.documentElement);
        realm.exec(((options && options.transpile) || String)(code));
        return null;
      });
    }
  };
}

const PARAMS = [];

function onAudioProcess (e) {
  const parameters = {};
  let index = -1;
  this.node.parameters.forEach((value, key) => {
    const arr = PARAMS[++index] || (PARAMS[index] = new Float32Array(BUFFER_SIZE));
    // @TODO proper values here if possible
    arr.fill(value.value);
    parameters[key] = arr;
  });
  this.processor.context.sampleRate = this.context.sampleRate;
  this.processor.context.currentTime = this.context.currentTime;
  const inputs = channelToArray(e.inputBuffer);
  const outputs = channelToArray(e.outputBuffer);
  this.instance.process([inputs], [outputs], parameters);

  // @todo - keepalive
  // let ret = this.instance.process([inputs], [outputs], parameters);
  // if (ret === true) { }
}

function channelToArray (ch) {
  const out = [];
  for (let i = 0; i < ch.numberOfChannels; i++) {
    out[i] = ch.getChannelData(i);
  }
  return out;
}

function getProcessorsForContext (audioContext) {
  return audioContext.$$processors || (audioContext.$$processors = {});
}
