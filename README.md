# EDCarnage

EDCarnage is a tool for tracking stacked massacre missions in **Elite: Dangerous**

![screenshot](https://raw.githubusercontent.com/mmomtchev/EDCarnage/main/screenshot.png?token=GHSAT0AAAAAABMRJQWOGMLI5AIF4BGCHS2QYPO6TMQ)

# Installation

Grab a binary from `Releases` - there is a Windows installer and a stand-alone ZIP folder.

# Usage

Nothing really to do, just launch it and it will parse the **Elite: Dangerous** journal.

As Elite Dangerous does not allow tracking which mission is currently progressing, per-hour statistics are not always accurate - if you have a high-paying and a low-paying mission, `EDCarnage` will take into account only the average mission reward until the mission completes - at this point it will readjust its statistics.

Also, sometimes, **Elite: Dangerous** will count a mission kill but won't display a screen message or update the log - I think it mainly happens with shared kills with the police or a teammate. In this case the counter will be off by one until the mission completes.

Happy bounty hunting!

# Contributing

The app uses the [Electron](https://www.electronjs.org/) framework with a Node.js back-end and a Chrome rendering engine. The display is rendered using [Handlebars](https://handlebarsjs.com/). Every 5s the backend will poll the Elite journals and it will update the display. Parsing is not incremental since it uses less than 1% CPU anyway. To checkout the development version and start it type:

```bash
git clone https://github.com/mmomtchev/EDCarnage.git
npm install
npm start
```

If you want to debug it using your own copy of the journals, you can specify it after `npm start`:
```
npm start test/test3
```
This will launch it with the journal set found in `test/test3`. This does not require a working **Elite: Dangerous** installation and works on all OSes.

If you want to modify the journal parsing, you should add new tests and make sure everything passes: `npm test`. This works on all OSes.
If you want to generate an installer or a standalone ZIP file you should run `npm run dist`. This works only on Windows.
