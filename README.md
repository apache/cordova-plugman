# Pluginstall

> script to install/uninstall Cordova plugins

## Usage

    pluginstall [-d] PLATFORM PROJECT-PATH PLUGIN-PATH|PLUGIN-GIT-URL

Example:

    pluginstall android . ~/plugins/ChildBrowser
    pluginstall -d android . https://github.com/alunny/ChildBrowser.git 

## Development

    git clone https://github.com/alunny/pluginstall.git
    cd pluginstall
    npm install
    npm test

Then go!

## Supported Platforms

* Android
* iOS
* www (copies plugin's www assets only, to PROJECT-PATH)

## plugin.xml Format

see https://github.com/alunny/cordova-plugin-spec

Currently support the August 16 revision, more or less.

## License

Apache
