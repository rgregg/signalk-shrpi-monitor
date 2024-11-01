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


## Configuring Access To Socket

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

### Access to the socket

You will also need to grant permissions to the socket to be used by non-root user, since
the default permissions for the socket are root. Since the socket is recreated each time
the service is reloaded, you need to adjust the group used for the socket to be the
default user (1000)'s group:

```bash
sudo nano /lib/systemd/system/shrpid.service
```

Then edit the line under `[Service]` to add a new parameter:

```
ExecStart=/usr/local/bin/shrpid -s /var/run/shrpid.sock -g {group_name}
```

Save the file, then you can reload systemctl and restart the service:

```
sudo systemctl daemon-reload
sudo systemctl restart shrpid
```

After this the SignalK server will have access to the socket to be able
to read and write, which is required to retrieve data from the daemon.

If this is configured incorrectly, you will see the following error in the debug log output:

```
Fri, 01 Nov 2024 19:10:51 GMT signalk-shrpi-monitor Error on request: Error: connect EACCES /var/run/shrpid.sock
```




Big thanks people who developed the previous generations of monitoring for the Raspberry Pi.
This code is based on:
https://github.com/sberl/signalk-rpi-monitor
https://github.com/nmostovoy/signalk-raspberry-pi-monitoring
https://github.com/sbender9/signalk-raspberry-pi-temperature
