# plugman

A command line tool to distribute and package plugins for use with Apache Cordova, nee PhoneGap.

This document defines tool usage and the plugin format specification.

## Quickstart

    npm install -g plugman

## Design Goals

* Facilitate programmatic installation and manipulation of plugins
* Detail the dependencies and components of individual plugins
* Allow code reuse between different target platforms


## Usage

    plugman --fetch --plugin <directory|git-url|name> [--plugins_dir <directory>]
    plugman --install --platform <ios|android|bb10> --project <directory> --plugin <name|url> [--plugins_dir <directory>] [--variable <name>=<value> [--variable <name>=<value> ...]]
    plugman --uninstall --platform <ios|android|bb10> --project <directory> --plugin <name> [--plugins_dir <directory>]
    plugman --list [--plugins_dir <directory>]
    plugman --prepare --platform <ios|android|bb10> --project <directory> [--plugins_dir <directory>]

* `--fetch`: Retrieves and stores a plugin
* `--install`: Installs a plugin into a cordova project. if `<name|url>` does not exist under the `plugins_dir`, will call `fetch` to retrieve it first.
* `--uninstall`: Uninstalls an already-`--install`'ed plugin from a cordova project
* `--list`: Lists all `--fetch`'ed plugins
* `--prepare`: Based on all installed plugins, will set up properly injecting plugin JavaScript code and setting up permissions properly. Implicitly called after `--install` and `--uninstall` commands. See below for more details.

Other parameters: 

* `--plugins_dir` defaults to `<project>/cordova/plugins`, but can be any directory containing a subdirectory for each fetched plugin.
* `--variable` allows to specify certain variables at install time, necessary for certain plugins requiring API keys or other custom, user-defined parameters.

Note that `--fetch` deals with the local cache of the plugin's files (in the `--plugins_dir` location) and doesn't care about platforms, while `--install` and `--uninstall` require specifying the target platform and the location of the project, and actually do installation of plugin code and assets.


### Supported Platforms

* iOS
* Android
* BB10

### Example Plugins

- Google has a [https://github.com/MobileChromeApps/chrome-cordova/plugins](bunch of plugins) which are maintained actively by a contributor to plugman
- Adobe maintains plugins for its Build cloud service, which are open sourced and [available on GitHub](https://github.com/phonegap-build)

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

## plugin.xml Manifest Format

Last edited May 2 2013.

The `plugin.xml` file is an XML document in the plugins namespace -
`http://apache.org/cordova/ns/plugins/1.0`. It contains a top-level `plugin`
element defining the plugin, and children that define the structure of the
plugin.

A sample plugin element:

	<?xml version="1.0" encoding="UTF-8"?>
    <plugin xmlns="http://apache.org/cordova/ns/plugins/1.0"
        xmlns:android="http://schemas.android.com/apk/res/android"
        id="com.alunny.foo"
        version="1.0.2">


### &lt;plugin&gt; element

The `plugin` element is the top-level element of the plugin manifest. It has the
following attributes:

#### xmlns (required)

The plugin namespace - `http://apache.org/cordova/ns/plugins/1.0`. If the document
contains XML from other namespaces - for example, tags to be added to the
AndroidManifest.xml file - those namespaces should also be included in the
top-level element.

#### id (required)

A reverse-domain style identifier for the plugin - for example, `com.alunny.foo`

#### version (required)

A version number for the plugin, that matches the following major-minor-patch
style regular expression:

    ^\d+[.]\d+[.]\d+$

### &lt;engines&gt; and &lt;engine&gt; elements

The child elements of the `<engines>` element specify versions of
Apache Cordova-based frameworks that this plugin supports. An example:

    <engines>
        <engine name="cordova" version="1.7.0" />
        <engine name="cordova" version="1.8.1" />
        <engine name="worklight" version="1.0.0" />
    </engines>

Similarly to the `version` attribute for the `<plugin>` element,
the version string specified should match a major-minor-patch string
conforming to the regular expression:

    ^\d+[.]\d+[.]\d+$

Engine elements may also have fuzzy matches to avoid repetition, and reduce
maintenance when the underlying platform is updated. A minimum of `>`, `>=`,
`<` and `<=` should be supported by tools, such as:

    <engines>
        <engine name="cordova" version=">=1.7.0" />
        <engine name="cordova" version="<1.8.1" />
    </engines>

plugman will abort plugin installation if the target project does not meet the engine constraints, and exit with a non-zero code.

If no `<engine>` tags are specified, plugman will attempt to install into the specified cordova project directory blindly.

### &lt;name&gt; element

A human-readable name for the plugin. The text content of the element contains
the name of the plugin. An example:

    <name>Foo</name>

This element does not (yet) handle localization.

### &lt;asset&gt; element

One or more elements listing the files or directories to be copied into a
Cordova app's `www` directory. A couple of samples:

    <!-- a single file, to be copied in the root directory -->
    <asset src="www/foo.js" target="foo.js" />
    <!-- a directory, also to be copied in the root directory -->
    <asset src="www/foo" target="foo" />

All assets tags require both a `src` attribute and a `target` attribute. Web-only plugins would contains mainly &lt;asset&gt; elements. &lt;asset&gt; elements can also be nested under &lt;platform&gt; elements, to specify platform-specific web assets (see below).

#### src (required)

Where the file or directory is located in the plugin package, relative to the
`plugin.xml` document.

If a file does not exist at the specified `src` location, plugman will stop/reverse the installation process and notify the user, and exit with a non-zero code.

#### target (required)

Where the file or directory should be located in the Cordova app, relative to
the `www` directory.

Assets can be targeted to subdirectories - for instance:

    <asset src="www/new-foo.js" target="js/experimental/foo.js" />

would create the `js/experimental` directory in the `www` directory, if not
present, and then copy the file `new-foo.js` as `foo.js` into that directory.

If a file exists at the target location, plugman will stop/reverse the installation process and notify the user of the conflict, and exit with a non-zero code.

### `&lt;js-module&gt;` element 

A typical plugin includes one or more JavaScript files. Rather than have the user of your plugin add `<script>` tags for your JavaScript to their HTML file(s) manually, you should use `<js-module>` tags for your Javascript files.

`<asset>` tags are a dumb copy: copy a file from the plugin subdirectory to `www`.

In contrast, `<js-module>` tags are much more sophisticated. They look like this:

    <js-module src="socket.js" name="Socket">
        <clobbers target="chrome.socket" />
    </js-module>

With the above example, a call to `plugman --prepare` will copy socket.js to `www/plugins/my.plugin.id/socket.js`. Further, it will add an entry for this plugin to `www/cordova_plugins.json`. At load time, code in `cordova.js` will use an XHR to read this file, inject a `<script>` tag for each Javascript file, and add a mapping to clobber or merge as appropriate (see below).

DO NOT wrap the file with `cordova.define`; this will be added automatically. Your module will be wrapped in a closure, and will have `module`, `exports` and `require` in scope, as normal for AMD modules.

Details for the `<js-module>` tag:

* The `src` points to a file in the plugin directory relative to the `plugin.xml` file.
* The `name` gives the last part of the module name. It can generally be whatever you like, and it only matters if you want to use `cordova.require` to import other parts of your plugins in your JavaScript code. The module name for a `<js-module>` is your plugin's `id` followed by the value of `name`. For the example above, with an `id` of `chrome.socket`, the module name is `chrome.socket.Socket`.
* Inside the `<js-module>` tag there are three legal sub-tags:
    * `<clobbers target="some.value" />` indicates that the `module.exports` will be inserted into the `window` object as `window.some.value`. You can have as many `<clobbers>` as you like. If the object(s) does not exist on `window`, they will be created.
    * `<merges target="some.value" />` indicates that your module should be merged with any existing value at `window.some.value`. If any key already exists, you module's version overrides the original. You can have as many `<merges>` as you like. If the object(s) does not exist on `window`, they will be created.
    * `<runs />` means that your code should be `cordova.require`d, but not installed on the `window` object anywhere. This is useful for initializing the module, attaching event handlers or otherwise. You can only have 0 or 1 `<runs />` tags. Note that including a `<runs />` with `<clobbers />` or `<merges />` is redundant, since they also `cordova.require` your module.
    * An empty `<js-module>` will still be loaded and can be `cordova.require`d in other modules.

If `src` does not resolve to a file that can be found, plugman will stop/reverse the installation, notify the user of the problem and exit with a non-zero code.

&lt;js-module&gt; elements can also be nested under &lt;platform&gt;, to declare platform-specific JavaScript module bindings.


### &lt;dependency&gt;

Dependency tags let you specify plugins on which this plugin depends. In the future there will be plugin repositories to fetch plugins from. In the short term, plugins are directly pointed to by URLs in `<dependency>` tags. These tags have the following format:

    <dependency id="com.plugin.id" src="https://github.com/myuser/someplugin" commit="428931ada3891801" subdir="some/path/here" />

* `id`: gives the ID of the plugin. This should be globally unique, and in reverse-domain style. Neither of these restrictions is currently enforced, but they may be in the future and plugins should still follow them.
* `src`: A URL for the plugin. This should point to a git repository, since plugman will try to `git clone` it.
* `commit`: This is any git ref. It can be a branch or tag name (eg. `master`, `0.3.1`), a commit hash (eg. `975ddb228af811dd8bb37ed1dfd092a3d05295f9`), anything understood by `git checkout`.
* `subdir`: Specifies that the plugin we're interested in exists as a subdirectory of the git repository. This is helpful because it allows one to keep several related plugins in a sigle git repository, and specify the plugins in it individually.

In the future, version constraints will be introduced, and a plugin repository will exist to support fetching by name instead of explicit URLs.

### &lt;platform&gt;

Platform tags identify platforms that have associated native code and/or require configuration file modifications. Tools using
this specification can identify supported platforms and install the code into
Cordova projects.

Plugins without `<platform>` tags are assumed to be JS-only, and therefore installable on any and all platforms.

A sample platform tag:

    <platform name="android">
    <!-- android specific elements -->
    </platform>
    <platform name="ios">
    <!-- ios specific elements -->
    </platform>

#### name (required)

The `name` attribute identifies a platform as supported - it also associates the
element's children with that platform.

Platform names should be all-lowercase. Platform names, as arbitrarily chosen,
are listed:

* android
* bb10
* ios
* wp7
* wp8
* windows8


### &lt;source-file&gt;

`source-file` elements identify executable source code that should be installed
into a project. A couple of examples:

    <!-- android -->
    <source-file src="src/android/Foo.java"
                    target-dir="src/com/alunny/foo" />
    <!-- ios -->
    <source-file src="src/ios/CDVFoo.m" />


#### src (required)

Where the file is located, relative to the `plugin.xml` file.

If `src` does not resolve to a file that can be found, plugman will stop/reverse the installation, notify the user of the problem and exit with a non-zero code.

#### target-dir

A directory where the files should be copied into, relative to the root of the
Cordova project.

In practice, this is most important for Java-based platforms, where a file in
the package `com.alunny.foo` has be located under the directory
`com/alunny/foo`. For platforms where the source directory is not important,
plugin authors should omit this attribute.

As with assets, if a `source-file`'s `target` would overwrite an existing file, plugman will stop/reverse the installation, notify the user and exit with a non-zero code.

### &lt;config-file&gt;

Identifies an XML-based configuration file to be modified, where in that
document the modification should take place, and what should be modified.

Two file types that have been tested for modification with this element are `xml` and `plist` files. 

The `config-file` element only allows for appending
new children into an XML document. The children are XML literals that are the
to be inserted in the target document.

Example for XML:

    <config-file target="AndroidManifest.xml" parent="/manifest/application">
        <activity android:name="com.foo.Foo" android:label="@string/app_name">
            <intent-filter>
            </intent-filter>
        </activity>
    </config-file>

Example for plist:


    <config-file target="*-Info.plist" parent="CFBundleURLTypes">
        <array>
            <dict>
                <key>PackageName</key>
                <string>$PACKAGE_NAME</string>
            </dict>
        </array>
    </config-file>

#### target

The file to be modified, and the path relative to the root of the Cordova
project.

The target can include a wildcard (`*`) element. In this case, plugman will recursively search through the project directory structure and use the first match.

On iOS, the location of configuration files relative to the project directory root is not known. Specifying a target of `config.xml` will resolve to `cordova-ios-project/MyAppName/config.xml`.

If the specified file does not exist, the tool will ignore the configuration change and continue installation.

#### parent

An XPath selector pointing to the parent of the elements to be added to the config file. If absolute selectors are used, you can use a wildcard (`*`) to specify the root element, e.g. `/*/plugins`.

For plist files, the parent is used to determine under what parent key should the specified XML be inserted.

If the selector does not resolve to a child of the specified document, the tool should stop/reverse the installation process, warn the user, and exit with a non-zero code.

### &lt;plugins-plist&gt;

This is OUTDATED as it only applies to cordova-ios 2.2.0 and below. Use &lt;config-file&gt; tag for newer versions of Cordova.

Example:

    <config-file target="config.xml" parent="/cordova/plugins">
         <plugin name="ChildBrowser" value="ChildBrowserCommand"/>
    </config-file>

Specifies a key and value to append to the correct `AppInfo.plist` file in an
iOS Cordova project. Example:

    <plugins-plist key="Foo" string="CDVFoo" />


### &lt;resource-file&gt; and &lt;header-file&gt;

Like source files, but specifically for platforms that distinguish between
source files, headers, and resources (iOS).

Examples:

    <resource-file src="CDVFoo.bundle" />
    <resource-file src="CDVFooViewController.xib" />
    <header-file src="CDVFoo.h" />

### &lt;framework&gt;

Identifies a framework (usually part of the OS/platform) that the plugin depends on.

Examples:

    <framework src="libsqlite3.dylib" />
    <framework src="social.framework" weak="true" />

plugman identifies the framework through the `src` attribute and attempts to add the framework to the Cordova project, in the correct fashion for a given platform.

The optional `weak` attribute is a boolean denoting whether the framework should be weakly-linked. Default is `false`.

### &lt;dependencies&gt; and &lt;dependency&gt;

Identifies dependency of the plugin on another plugin.

Example:

    <dependencies>
        <dependency name="com.facebook.plugin" url="http://plugins.cordova.io" />
        <dependency name="com.adobe.omniture" url="http://plugins.phonegap.com" version="1.0.0" />
    </dependencies>

Dependencies denote other plugins that must be installed in order for the current plugin to work properly.

Two different versions of the same plugin cannot be installed into the same application. If the user attempts to do so, the tooling should error out appropriately and exit with a non-zero code.

Dependent plugins should be fetched first and stored in the user's specified plugins directory (or the default enforced by the tool if none is specified). These plugins are then installed into the user's cordova project, one by one, in a recursive fashion.
If installation of any dependent plugin is not successful, the tool should not proceed with installation of the parent plugin and reverse all changes made to the cordova project by the installation.

#### name

A reverse-style domain identifier, as specified by a plugin in the top-level `plugin` element's `id` attribute.

#### url

URL pointing to a valid cordova plugin "universe."

The tooling should retrieve plugin contents based on a combination of this URL and the `name` attribute, i.e. `url` + '/' + `name`.

If the retrieval URL does not resolve or does not contain a valid plugin.xml file, the tool should error out and exit with a non-zero code.

#### version

Optionally you can specify a version requirement for the plugin dependency. Identical syntax for the `&lt;engine&gt;` element's `version` attribute above should be employed. 

### &lt;info&gt;

The tool will provide additional information to users. This is useful when you require some extra steps that can't be easily automated or are out of the scope of plugman.

Examples:

    <info>
    You need to install **Google Play Services** from the `Android Extras` section using the Android SDK manager (run `android`).

    You need to add the following line to your `local.properties`
        
    android.library.reference.1=PATH_TO_ANDROID_SDK/sdk/extras/google/google_play_services/libproject/google-play-services_lib
    </info>

## Variables

In certain cases, a plugin may need to make configuration changes dependent on
the target application. For example, to register for C2DM on Android, an app
with package id `com.alunny.message` would need a permission like:

    <uses-permission
    android:name="com.alunny.message.permission.C2D_MESSAGE"/>

In cases like this (where the content inserted from the `plugin.xml` file is
not known ahead of time), variables can be indicated by a dollar-sign and a
series of capital letters, digits and underscores. For the above example, the
`plugin.xml` file would include this tag:

    <uses-permission
    android:name="$PACKAGE_NAME.permission.C2D_MESSAGE"/>

plugman replaces variable references with the
correct value, if specified, or the empty string otherwise. The value of the
variable reference may be detected (in this case, from the `AndroidManifest.xml`
file), or specified by the user of the tool; the exact process is dependent on
the particular tool.

plugman can request users to specify variables required by a plugin. For example API keys for C2M and Google Maps can be specified as a command line argument like so:

    plugman --platform ios|android --project /path/to/project --plugin name|git-url|path --variable API_KEY="!@CFATGWE%^WGSFDGSDFW$%^#$%YTHGsdfhsfhyer56734"

A preference tag will need to be present inside the platform tag to make the variable mandatory like so:

    <preference name="API_KEY" />

plugman should check that these required preferences are passed in, and if not, should warn the user on how to pass the variable in and exit with a non-zero code.

Certain variable names should be reserved - these are listed below.

### $PACKAGE_NAME

The reverse-domain style unique identifier for the package - corresponding to
the `CFBundleIdentifier` on iOS or the `package` attribute of the top-level
`manifest` element in an `AndroidManifest.xml` file.

## Contributors

See the package.json file for attribution notes.

## License

Apache License 2.0
