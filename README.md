# signalk-shrpi-monitor
Signal K Node Server Plugin for Sailor Hat monitoring (based on signalk-rpi-monitor)

Reports:
- Input Voltage
- SuperCaps Voltage
- Input Amperage
- MCU temperature (Kelvin)
- System Status 

In order for the plugin to work, the [Sailor Hat software](https://docs.hatlabs.fi/sh-rpi/docs/software/)
must be installed and configured on the host device.

Additionally the unix socket for accessing data must be
available to the SignalK service. This is configurable
through the plugin options. If you are running SignalK
in a docker container, make sure to pass the socket into
the container.


Big thanks people who developed the previous generations of monitoring for the Raspberry Pi.
This code is based on:
https://www.npmjs.com/package/signalk-raspberry-pi-monitoring
https://github.com/nmostovoy/signalk-raspberry-pi-monitoring

which is based on:
https://www.npmjs.com/package/signalk-raspberry-pi-temperature
https://github.com/sbender9/signalk-raspberry-pi-temperature
