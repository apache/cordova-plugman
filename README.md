# plugman

A command line tool to install and uninstall plugins for use with [Apache Cordova](http://cordova.io) projects.

This document defines tool usage.

## Plugin Specification

--&gt; [plugin_spec.md](plugin_spec.md) &lt;--

## Quickstart

    npm install -g plugman

## Design Goals

* Facilitate programmatic installation and manipulation of plugins
* Detail the dependencies and components of individual plugins
* Allow code reuse between different target platforms

## Supported Platforms

* iOS
* Android
* BlackBerry 10
* Windows Phone 7

## Usage

    plugman --install --platform <ios|android|blackberry10|wp7|wp8> --project <directory> --plugin <name|url|path> [--plugins_dir <directory>] [--www <directory>] [--variable <name>=<value> [--variable <name>=<value> ...]]
    plugman --uninstall --platform <ios|android|blackberr10|wp7|wp8> --project <directory> --plugin <name> [--www <directory>] [--plugins_dir <directory>]

* `--install`: Installs a plugin into a cordova project. You must specify a platform and cordova project location for that platform. You also must specify a plugin, with the different `--plugin` parameter forms being:
  * `name`: The directory name where the plugin contents exist. This must be an existing directory under the `--plugins_dir` path (see below for more info).
  * `url`: A URL starting with https:// or git://, pointing to a valid git repository that is clonable and contains a `plugin.xml` file. The contents of this repository would be copied into the `--plugins_dir`.
  * `path`: A path to a directory containing a valid plugin which includes a `plugin.xml` file. This path's contents will be copied into the `--plugins_dir`.
* `--uninstall`: Uninstalls an already-`--install`'ed plugin from a cordova project

Other parameters: 

* `--plugins_dir` defaults to `<project>/cordova/plugins`, but can be any directory containing a subdirectory for each fetched plugin.
* `--www` defaults to the project's `www` folder location, but can be any directory that is to be used as cordova project application web assets.
* `--variable` allows to specify certain variables at install time, necessary for certain plugins requiring API keys or other custom, user-defined parameters. Please see the [plugin specification](plugin_spec.md) for more information.


## Example Plugins

- Google has a [https://github.com/MobileChromeApps/chrome-cordova/plugins](bunch of plugins) which are maintained actively by a contributor to plugman
- Adobe maintains plugins for its Build cloud service, which are open sourced and [available on GitHub](https://github.com/phonegap-build)
- BlackBerry has a [https://github.com/blackberry/cordova-blackberry-plugins](bunch of plugins) offering deep platform integration

## Development

Basic installation:

    git clone https://git-wip-us.apache.org/repos/asf/cordova-plugman.git
    cd cordova-plugman
    npm install -g

Linking the global executable to the git repo:

    git clone https://git-wip-us.apache.org/repos/asf/cordova-plugman.git
    cd cordova-plugman
    npm install
    sudo npm link

## Plugin Directory Structure

A plugin is typically a combination of some web/www code, and some native code.
However, plugins may have only one of these things - a plugin could be a single
JavaScript file, or some native code with no corresponding JavaScript.

Here is a sample plugin named foo with android and ios platforms support, and 2 www assets.

```
foo-plugin/
|- plugin.xml     # xml-based manifest
|- src/           # native source for each platform
|  |- android/
|  |  `- Foo.java
|  `- ios/
|     |- CDVFoo.h
|     `- CDVFoo.m
|- README.md
`- www/
   |- foo.js
   `- foo.png
```

This structure is suggested, but not required.

## Contributors

See the [package.json](package.json) file for attribution notes.

## License

Apache License 2.0
