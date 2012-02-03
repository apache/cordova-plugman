var path = require('path'),
    M_EXTENSION = /[.]m$/, SOURCE_FILE = 'sourcecode.c.objc',
    H_EXTENSION = /[.]h$/, HEADER_FILE = 'sourcecode.c.h',
    BUNDLE_EXTENSION = /[.]bundle$/, BUNDLE = '"wrapper.plug-in"',
    XIB_EXTENSION = /[.]xib$/, XIB_FILE = 'file.xib',
    DEFAULT_SOURCE_TREE = '"<group>"',
    DEFAULT_FILE_ENCODING = 4;

function detectLastType(path) {
    if (M_EXTENSION.test(path))
        return SOURCE_FILE;

    if (H_EXTENSION.test(path))
        return HEADER_FILE;

    if (BUNDLE_EXTENSION.test(path))
        return BUNDLE;

    if (XIB_EXTENSION.test(path))
        return XIB_FILE;

    // dunno
    return 'unknown';
}

function fileEncoding(file) {
    if (file.lastType != BUNDLE) {
        return DEFAULT_FILE_ENCODING;
    }
}

function pbxFile(filepath, opt) {
    var opt = opt || {};

    this.path = filepath;
    this.lastType = opt.lastType || detectLastType(filepath);
    this.basename = path.basename(filepath);

    if (this.lastType == SOURCE_FILE) {
        this.group = 'Sources';
    } else {
        this.group = 'Resources';
    }

    this.sourceTree = opt.sourceTree || DEFAULT_SOURCE_TREE;
    this.fileEncoding = opt.fileEncoding || fileEncoding(this);
}

module.exports = pbxFile;
