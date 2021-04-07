# lifxsh

Node.js based command line interface for controlling LIFX lamps. Uses the LIFX
LAN protocol for communication.

![lifxsh example
screenshot](https://raw.githubusercontent.com/ristomatti/lifxsh/master/example-screenshot.png)

## Release notes

### Version 0.9.1

- remove babel transpilation
- update dependencies

### Version 0.8.1

- add support for listing known light addresses in $HOME/.lifxsh/settings.yml
- fix bug on tab complete

### Version 0.8.0

- preliminary support for MultiZone lights with "zone" command

### Version 0.7.0

- preliminary infrared LED support added (brightness can be changed but the
  light list information still needs to be updated)

### Version 0.6.x

- works with all current LIFX products (no support for LIFX+ or LIFX Z special
  features yet)
- uses LAN protocol (fast/responsive) - thanks
  [MariusRumpf/node-lifx](https://github.com/MariusRumpf/node-lifx)!
- interactive color CLI - thanks
  [dthree/vorpal](https://github.com/dthree/vorpal)!
  - in-app help
  - tab completion of light names (lowercase form based on given labels)
  - command history
  - logs individual bulb/strip online/offline statuses
  - list all lights with power state, color information and IP address
  - multiple light names can be listed to set all at once
  - alias `all` can be used to target all lights, alternatively name can be
    omitted
  - caches the previous color properties fetched from lights to allow changing
    only single attribute (LAN protocol defines hue/saturation/brightness need
    to always be sent together)
- supports most LIFX functionalities
  - on/off toggle with optional transition delay
  - change color using hue/saturation/brightness and luminosity (kelvin) (with
    optional transition delay)

### Planned features

- show light type in listing
- configuration file
  - alias names for lights
  - aliases for light groups
  - presets
- in-app saving of aliases/presets

### Known issues

- after tab completion, sometimes first press of backspace does not register

## Install using NPM

### Global (might require sudo)

```bash npm install --global lifxsh ```

### Local

```bash npm install lifxsh ```

## Usage

1. Run `lifxsh` (global install) or `node_modules/.bin/lifxsh` (local install)
2. Type `help`
