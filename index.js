/*
 * Copyright 2022 Steve Berl (steveberl@gmail.com)
 * This plugin is a modified version of:
 * https://github.com/nmostovoy/signalk-raspberry-pi-monitoring
 *
 * which is a modified version of
 * https://github.com/sbender9/signalk-raspberry-pi-temperature
 *
 * So a big thank you to those who built the foundation on which I am 
 * adding to.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('signalk-shrpi-monitor')
const _ = require('lodash')
//const spawn = require('child_process').spawn
const http = require('http');

const get_state_command = 'curl --unix-socket /var/run/shrpid.sock http://localhost/state'
const get_values_command = 'curl --unix-socket /var/run/shrpid.sock http://localhost/values'

// const gpu_temp_command = 'vcgencmd measure_temp'
// const cpu_temp_command = 'cat /sys/class/thermal/thermal_zone0/temp'
// const cpu_util_mpstat_command = 'S_TIME_FORMAT=\'ISO\' mpstat -P ALL 5 1 | sed -n 4,8p'
// const mem_util_command = 'cat /proc/meminfo'
// const sd_util_command = 'df --output=pcent \/\| tail -1 \| awk \'gsub\(\"\%\",\"\"\)\''

module.exports = function(app) {
  var plugin = {};
  var timer

  plugin.id = "signalk-shrpi-monitor"
  plugin.name = "Sailor Hat monitor"
  plugin.description = "Signal K Node Server Plugin for Sailor Hat montioring"

  plugin.schema = {
    type: "object",
    description: "Configure the options for requesting and reporting data from the Sailor Hat board.",
    properties: {
      default_socket: {
        title: "UNIX socket for Sailor Data data",
        type: "string",
        default: "/var/run/shrpid.sock"
      },
      path_mcu_temp: {
        title: "SignalK Path for MCU temperature (K)",
        type: "string",
        default: "environment.sailorhat.mcu.temperature",
      },
      path_input_voltage: {
        title: "SignalK Path for input voltage (V)",
        type: "string",
        default: "environment.sailorhat.input.voltage",
      },
      path_input_amps: {
        title: "SignalK Path for current input (A)",
        type: "string",
        default: "environment.sailorhat.input.amps",
      },
      path_caps_voltage: {
        title: "SignalK Path for super-capacitor voltage (V)",
        type: "string",
        default: "environment.sailorhat.capacitor.voltage",
      },
      path_shrpi_state: {
        title: "SignalK Path for Sailor Hat state",
        type: "string",
        default: "environment.sailorhat.state"
      },
      path_output_enabled: {
        title: "SignalK Path for 5V output enabled state",
        type: "string",
        default: "environment.sailorhat.5v_output"
      },
      path_watchdog_enabled: {
        title: "SignalK Path for watchdog enabled",
        type: "string",
        default: "environment.sailorhat.watchdog_enabled"
      },
      rate: {
        title: "Sample Rate (in seconds)",
        type: 'number',
        default: 30
      }
    }
  }


  plugin.start = function(options) {
    debug("start")

    // notify server, once, of units metadata
    app.handleMessage(plugin.id, {
        updates: [{
            meta: [{
                    path: options.path_mcu_temp,
                    value: {
                        units: "K"
                    }
                },
                {
                    path: options.path_input_voltage,
                    value: {
                        units: "V"
                    }
                },
                {
                    path: options.path_input_amps,
                    value: {
                        units: "A"
                    }
                },
                {
                    path: options.path_caps_voltage,
                    value: {
                        units: "V"
                    }
                },
                {
                  path: options.path_shrpi_state,
                  value: {
                    units: "string"
                  }
                },
                {
                  path: options.path_output_enabled,
                  value: {
                    units: "string"
                  }
                },
                {
                  path: options.path_watchdog_enabled,
                  value: {
                    units: "string"
                  }
                },
            ]
        }]
    });

    
    
    let isUpdating = false;
    function updateEnv() {
      if (isUpdating) {
        debug("updateEnv called while we were already in progress of an update. skipping run");
        return;
      } 
      isUpdating = true;
      getSailorHatValues();
      getSailorHatState();
      isUpdating = false;
      debug("updateEnv has finished running.");
    }
    function getSailorHatValues() {
      // {"V_in": 11.912109375, "V_supercap": 8.793017578125, "I_in": 0.3515625, "T_mcu": 298.9921875}
      
      const httpOptions = {
        socketPath: options.default_socket, // Path to the Unix socket
        path: '/values',                     // URL path of the request
        method: 'GET',                      // HTTP method
        headers: {
          'Host': 'localhost',              // The 'Host' header is required
        }
      };

      const request = http.request(httpOptions, (response) => {
        let data = '';
      
        response.on('data', (chunk) => {
          data += chunk;
        });
      
        response.on('end', () => {
          debug(`got values: ${data}`)
          
          try
          {
            const jsonData = JSON.parse(data);
            // Destructure individual variables
            const { V_in, V_supercap, I_in, T_mcu } = jsonData;
  
            app.handleMessage(plugin.id, {
              updates: [
                {
                  values: [ 
                    {
                      path: options.path_input_voltage,
                      value: Number(V_in)
                    },
                    {
                      path: options.path_caps_voltage,
                      value: Number(V_supercap)
                    },
                    {
                      path: options.path_input_amps,
                      value: Number(I_in)
                    },
                    {
                      path: options.path_mcu_temp,
                      value: Number(T_mcu)
                    }
                  ]
                }
              ]
            })
          }
          catch (error)
          {
            debug(`error parsing JSON: ${error}`)
          }
          
        });
      });
      
      request.on('error', (error) => {
        debug(`Error on request: ${error}`)
      });
      
      request.end();
    }

    function getSailorHatState() {
      // {"state": "POWER_ON_5V_ON", "5v_output_enabled": true, "watchdog_enabled": true}

      const httpOptions = {
        socketPath: options.default_socket, // Path to the Unix socket
        path: '/state',                     // URL path of the request
        method: 'GET',                      // HTTP method
        headers: {
          'Host': 'localhost',              // The 'Host' header is required
        }
      };

      const request = http.request(httpOptions, (response) => {
        let data = '';
      
        response.on('data', (chunk) => {
          data += chunk;
        });
      
        response.on('end', () => {
          debug(`got state: ${data}`)
          try {

            
            const jsonData = JSON.parse(data);

            // Destructure individual variables
            const { state, "5v_output_enabled": outputEnabled, "watchdog_enabled": watchdogEnabled } = jsonData;

            app.handleMessage(plugin.id, {
              updates: [
                {
                  values: [ 
                    {
                      path: options.path_shrpi_state,
                      value: state
                    },
                    {
                      path: options.path_output_enabled,
                      value: outputEnabled
                    },
                    {
                      path: options.path_watchdog_enabled,
                      value: watchdogEnabled
                    },
                  ]
                }
              ]
            })
          }
          catch (error)
          {
            debug(`error parsing JSON: ${error}`)
          }
        });
      });
      
      request.on('error', (error) => {
        debug(`Error on request: ${error}`)
      });
      
      request.end();
    }

    debug(`interval set to ${options.rate}`)
    updateEnv()
    setInterval(updateEnv, options.rate * 1000)
  }

  plugin.stop = function() {
    debug("plugin stopping")
    if ( timer ) {
      clearInterval(timer)
      timer =  null
    }
  }

  return plugin
}
