# The Future of Plugman and CLI

In this branch, Plugman is undergoing major changes to make the split of responsibilities between plugman and cordova-cli clear.

## Responsibilities

* cordova-cli is responsible for handling multiple platforms. That means it has the separate `platforms/{ios,android,etc}` directories, a top-level `www/` and so on.
* plugman is responsible for everything to do with plugins: fetching them, installing native code, installing JS code, keeping track of which ones are installed, removing them.

## High-level changes

Plugman now holds onto the code of the plugin, instead of cloning it into a temporary folder and throwing it away. By default it uses the `cordova/plugins` directory, but this can be overridden with `--plugins_dir=some/path`. This enables cordova-cli to use its top-level `plugins/` directory.

See the next section for the changes to the commands and arguments.

## Commands

### `--fetch`

Does the actual downloading of the plugin, from Github, the repository or the local disk.

This supports cordova-cli, which will want to `--fetch` once into its top-level `plugins/` directory and then `--install` once for each platform.

### `--install`

Takes the previously fetched plugin files and installs them into a project. Needs a path to the plugin directory, the path to the project, and the platform, similar to now.

Installs the native code and makes the necessary configuration changes.

### `--uninstall`

Removes the native code and undoes the configuration changes and so on.

Care is required here not to remove permissions that are still needed by other plugins. (Read: config changes should be cleared and recreated from the currently installed plugins every time. This applies to permissions, `<plugin>` tags and so on.)

### `--prepare`

Takes over part of cordova-cli's `prepare` command. Copies all plugins' Javascript files (more precisely, those specified in `<js-module>` tags rather than `<asset>` tags) into `www/plugins/com.plugin.id/whatever/path/file.js` and constructs the `cordova_plugins.json` file.

`cordova.js` in this new model will have code that reads this `cordova_plugins.json` file via XHR, loads the JS files for the plugins, and does their clobbers and merges.

This is something of a change from the current cordova-cli method, but necessary because we won't be working with a fresh `cordova.js` file on each run anymore.
