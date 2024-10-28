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

If you are using docker-compose, you can reference the socket like this:

```yaml
  signalk:
    image: signalk/signalk-server:latest
    ...
    volumes:
      - /var/run/shrpid.sock:/var/run/shrpid.sock
      ...
```

You will also need to grant permissions to the socket to be used by non-root user, since
the default permissions for the socket are root. To allow anyone to read/write to the socket:

```sh
sudo chmod a+rw /var/run/shrpid.sock
```




Big thanks people who developed the previous generations of monitoring for the Raspberry Pi.
This code is based on:
https://github.com/sberl/signalk-rpi-monitor
https://github.com/nmostovoy/signalk-raspberry-pi-monitoring
https://github.com/sbender9/signalk-raspberry-pi-temperature
