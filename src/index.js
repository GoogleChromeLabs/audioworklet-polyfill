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

const PARAMS = [];
let nextPort;

if (typeof AudioWorkletNode !== 'function' || !("audioWorklet" in AudioContext.prototype)) {
  self.AudioWorkletNode = function AudioWorkletNode (context, name, options) {
    const processor = getProcessorsForContext(context)[name];
    const outputChannels = options && options.outputChannelCount ? options.outputChannelCount[0] : 2;
    const scriptProcessor = context.createScriptProcessor(undefined, 2, outputChannels);

    const automationEvents = new Map();

    function SetValue (value, startTime) {
      this.eventTime = startTime;
      this.v = value;
    }
    SetValue.prototype.func = function (t) {
      return t >= this.eventTime ? this.v : this.v0;
    };

    function ExponentialRampToValue (value, endTime) {
      this.eventTime = endTime;
      this.v1 = value;
    }
    ExponentialRampToValue.prototype.func = function (t) {
      if (t >= this.eventTime) {
        return this.v1;
      }
      if (t <= this.t0 || this.v1 * this.v0 <= 0) {
        return this.v0;
      }
      return this.v0 * Math.pow(this.v1 / this.v0, (t - this.t0) / (this.eventTime - this.t0));
    };

    function LinearRampToValue (value, endTime) {
      this.eventTime = endTime;
      this.v1 = value;
    }
    LinearRampToValue.prototype.func = function (t) {
      if (t >= this.eventTime) {
        return this.v1;
      }
      if (t <= this.t0) {
        return this.v0;
      }
      return this.v0 + (this.v1 - this.v0) * (t - this.t0) / (this.eventTime - this.t0);
    };

    function SetTarget (target, startTime, timeConstant) {
      this.eventTime = startTime;
      this.v1 = target;
      this.tau = timeConstant;
    }
    SetTarget.prototype.func = function (t) {
      if (t <= this.eventTime) {
        return this.v0;
      }
      return this.v1 + (this.v0 - this.v1) * Math.exp((this.eventTime - t) / this.tau);
    };

    function SetValueCurve (values, startTime, duration) {
      this.eventTime = startTime;
      this.values = values;
      this.duration = duration;
    }
    SetValueCurve.prototype.func = function (t) {
      if (t <= this.eventTime) {
        return this.v0;
      }
      const d = this.duration / (this.values.length - 1);
      const k = Math.floor((t - this.eventTime) / d);
      if (k >= this.values.length - 1) {
        return this.values[this.values.length - 1];
      }
      const tk = k * d + this.eventTime;
      return this.values[k] + (this.values[k + 1] - this.values[k]) * (t - tk) / d;
    };

    function startEvent (event, startValue, startTime) {
      event.v0 = startValue;
      event.t0 = startTime;
    }

    function scheduleAutomationEvent (paramName, event) {
      const eventQueue = automationEvents.get(paramName);
      let i = eventQueue.length - 1;
      while (i >= 0 && eventQueue[i].eventTime > event.eventTime) {
        i--;
      }
      if (i === -1) {
        const v = scriptProcessor.parameters.get(paramName).value;
        const t = context.currentTime;
        if (event instanceof SetValue) {
          startEvent(event, v, t);
        } else {
          eventQueue.splice(0, 0, new SetValue(v, t));
          i = 0;
        }
      }
      eventQueue.splice(i + 1, 0, event);
    }

    scriptProcessor.parameters = new Map();
    if (processor.properties) {
      for (let i = 0; i < processor.properties.length; i++) {
        const prop = processor.properties[i];
        const node = context.createGain().gain;
        node.value = prop.defaultValue;
        node.cancelAndHoldAtTime = function (cancelTime) {
          const eventQueue = automationEvents.get(prop.name);
          let i = 0;
          while (i < eventQueue.length && eventQueue[i].eventTime <= cancelTime) {
            i++;
          }
          const e1 = i > 0 ? eventQueue[i - 1] : null;
          const e2 = i < eventQueue.length ? eventQueue[i] : null;
          if (e2 instanceof LinearRampToValue || e2 instanceof ExponentialRampToValue) {
            for (let j = 1; j <= i; j++) {
              const t = eventQueue[j - 1].eventTime;
              startEvent(eventQueue[j], eventQueue[j - 1].func(t), t);
            }
            e2.v1 = e2.func(cancelTime);
            e2.eventTime = cancelTime;
            i += 1;
          } else if (e1 instanceof SetTarget) {
            for (let j = 1; j < i; j++) {
              const t = eventQueue[j - 1].eventTime;
              startEvent(eventQueue[j], eventQueue[j - 1].func(t), t);
            }
            eventQueue.splice(i, 0, new SetValue(e1.func(cancelTime), cancelTime));
            i += 1;
          } else if (e1 instanceof SetValueCurve && cancelTime < e1.eventTime + e1.duration) {
            const v = e1.func(cancelTime);
            const newN = Math.floor((cancelTime - e1.eventTime) / e1.duration * e1.values.length);
            e1.duration = newN / e1.values.length * e1.duration;
            e1.values.splice(newN);
            eventQueue.splice(i, 0, new LinearRampToValue(v, cancelTime));
          }
          eventQueue.splice(i);
        };
        node.cancelScheduledValues = function (cancelTime) {
          const eventQueue = automationEvents.get(prop.name);
          let i = 0;
          while (i < eventQueue.length && eventQueue[i].eventTime <= cancelTime) {
            i++;
          }
          eventQueue.splice(i);
          for (let j = 1; j < i; j++) {
            const t = eventQueue[j - 1].eventTime;
            startEvent(eventQueue[j], eventQueue[j - 1].func(t), t);
          }
          eventQueue.push(new SetValue(eventQueue[i - 1].func(cancelTime), cancelTime));
        };
        node.exponentialRampToValueAtTime = function (value, endTime) {
          if (endTime < context.currentTime) {
            endTime = context.currentTime;
          }
          scheduleAutomationEvent(prop.name, new ExponentialRampToValue(value, endTime));
        };
        node.linearRampToValueAtTime = function (value, endTime) {
          if (endTime < context.currentTime) {
            endTime = context.currentTime;
          }
          scheduleAutomationEvent(prop.name, new LinearRampToValue(value, endTime));
        };
        node.setTargetAtTime = function (target, startTime, timeConstant) {
          if (startTime < context.currentTime) {
            startTime = context.currentTime;
          }
          scheduleAutomationEvent(prop.name, new SetTarget(target, startTime, timeConstant));
        };
        node.setValueAtTime = function (value, startTime) {
          scheduleAutomationEvent(prop.name, new SetValue(value, startTime));
        };
        node.setValueAtTime = function (values, startTime, duration) {
          if (startTime < context.currentTime) {
            startTime = context.currentTime;
          }
          scheduleAutomationEvent(prop.name,
            new SetValueCurve(Array.from(values), startTime, duration));
        };
        // @TODO there's no good way to construct the proxy AudioParam here
        scriptProcessor.parameters.set(prop.name, node);
        automationEvents.set(prop.name, []);
      }
    }

    const mc = new MessageChannel();
    nextPort = mc.port2;
    const inst = new processor.Processor(options || {});
    nextPort = null;

    scriptProcessor.port = mc.port1;
    scriptProcessor.processor = processor;
    scriptProcessor.instance = inst;
    scriptProcessor.onaudioprocess = function onAudioProcess (e) {
      const parameters = {};
      let index = -1;
      this.parameters.forEach((value, key) => {
        const arr = PARAMS[++index] || (PARAMS[index] = new Float32Array(this.bufferSize));
        const schedule = automationEvents.get(key);
        if (schedule.length === 0) {
          arr.fill(value.value);
        } else {
          for (let i = 0; i < arr.length; i++) {
            const t = context.currentTime + i / context.sampleRate;
            while (schedule.length !== 0 && t > schedule[0].eventTime) {
              if (schedule[0] instanceof SetTarget) {
                if (schedule.length < 2) {
                  break;
                }
                if (schedule[1] instanceof SetTarget && t < schedule[1].eventTime) {
                  break;
                }
                value.value = schedule[0].func(schedule[1].eventTime);
              } else if (schedule[0] instanceof SetValueCurve) {
                if (t < schedule[0].eventTime + schedule[0].duration) {
                  break;
                }
                value.value = schedule[0].values[schedule[0].values.length - 1];
              } else {
                value.value = schedule[0].func(schedule[0].eventTime);
              }
              schedule.shift();
              if (schedule.length !== 0) {
                startEvent(schedule[0], value.value, t);
              }
            }
            if (schedule.length !== 0) {
              arr[i] = schedule[0].func(t);
            } else {
              arr.fill(value.value, i);
              break;
            }
          }
          value.value = arr[arr.length - 1];
        }
        parameters[key] = arr;
      });
      this.processor.realm.exec(
        'self.sampleRate=sampleRate=' + this.context.sampleRate + ';' +
        'self.currentTime=currentTime=' + this.context.currentTime
      );
      const inputs = channelToArray(e.inputBuffer);
      const outputs = channelToArray(e.outputBuffer);
      this.instance.process([inputs], [outputs], parameters);

      // @todo - keepalive
      // let ret = this.instance.process([inputs], [outputs], parameters);
      // if (ret === true) { }
    };
    return scriptProcessor;
  };

  Object.defineProperty((self.AudioContext || self.webkitAudioContext).prototype, 'audioWorklet', {
    get () {
      return this.$$audioWorklet || (this.$$audioWorklet = new self.AudioWorklet(this));
    }
  });

  self.AudioWorklet = class AudioWorklet {
    constructor (audioContext) {
      this.$$context = audioContext;
    }

    addModule (url, options) {
      return fetch(url).then(r => {
        if (!r.ok) throw Error(r.status);
        return r.text();
      }).then(code => {
        const context = {
          sampleRate: this.$$context.sampleRate,
          currentTime: this.$$context.currentTime,
          AudioWorkletProcessor () {
            this.port = nextPort;
          },
          registerProcessor: (name, Processor) => {
            const processors = getProcessorsForContext(this.$$context);
            processors[name] = {
              realm,
              context,
              Processor,
              properties: Processor.parameterDescriptors || []
            };
          }
        };

        context.self = context;
        const realm = new Realm(context, document.documentElement);
        realm.exec(((options && options.transpile) || String)(code));
        return null;
      });
    }
  };
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
