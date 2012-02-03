var util = require('util'),
    f = util.format,
    EventEmitter = require('events').EventEmitter,
    path = require('path'),
    uuid = require('node-uuid'),
    fork = require('child_process').fork,
    pbxWriter = require('./pbxWriter'),
    pbxFile = require('./pbxFile'),
    COMMENT_KEY = /_comment$/

function pbxProject(filename) {
    this.filepath = path.resolve(filename)
}

util.inherits(pbxProject, EventEmitter)

pbxProject.prototype.parse = function (cb) {
    var worker = fork(__dirname + '/parseJob.js', [this.filepath])

    worker.on('message', function (msg) {
        if (msg.code) {
            this.emit('error', msg);
        } else {
            this.hash = msg;
            this.emit('end', null, msg)
        }
    }.bind(this));

    if (cb)
        this.on('end', cb);

    return this;
}

pbxProject.prototype.writeSync = function () {
    this.writer = new pbxWriter(this.hash);
    return this.writer.writeSync();
}

pbxProject.prototype.allUuids = function () {
    var sections = this.hash.project.objects,
        uuids = [],
        section;

    for (key in sections) {
        section = sections[key]
        uuids = uuids.concat(Object.keys(section))
    }

    uuids = uuids.filter(function (str) {
        return !COMMENT_KEY.test(str) && str.length == 24;
    });

    return uuids;
}

pbxProject.prototype.generateUuid = function () {
    var id = uuid.v4()
                .replace(/-/g,'')
                .substr(0,24)
                .toUpperCase()

    if (this.allUuids().indexOf(id) >= 0) {
        return this.generateUuid();
    } else {
        return id;
    }
}

pbxProject.prototype.addSourceFile = function (path, opt) {
    var file = new pbxFile(path, opt);

    file.uuid = this.generateUuid();
    file.fileRef = this.generateUuid();

    this.addToPbxBuildFileSection(file);        // PBXBuildFile
    this.addToPbxFileReferenceSection(file);    // PBXFileReference
    this.addToPluginsPbxGroup(file);            // PBXGroup
    this.addToPbxSourcesBuildPhase(file);       // PBXSourcesBuildPhase

    return file;
}

pbxProject.prototype.addHeaderFile = function (path, opt) {
    var file = new pbxFile(path, opt);

    file.fileRef = this.generateUuid();

    this.addToPbxFileReferenceSection(file);    // PBXFileReference
    this.addToPluginsPbxGroup(file);            // PBXGroup

    return file;
}

pbxProject.prototype.addResourceFile = function (path, opt) {
    var file = new pbxFile(path, opt);

    file.uuid = this.generateUuid();
    file.fileRef = this.generateUuid();

    this.addToPbxBuildFileSection(file);        // PBXBuildFile
    this.addToPbxFileReferenceSection(file);    // PBXFileReference
    this.addToPluginsPbxGroup(file);            // PBXGroup
    this.addToPbxResourcesBuildPhase(file);     // PBXResourcesBuildPhase

    /*
     * PBXResourcesBuildPhase
     */

    return file;
}

// helper addition functions
pbxProject.prototype.addToPbxBuildFileSection = function (file) {
    var commentKey = f("%s_comment", file.uuid);

    this.pbxBuildFileSection()[file.uuid] = pbxBuildFileObj(file);
    this.pbxBuildFileSection()[commentKey] = pbxBuildFileComment(file);
}

pbxProject.prototype.addToPbxFileReferenceSection = function (file) {
    var commentKey = f("%s_comment", file.fileRef);

    this.pbxFileReferenceSection()[file.fileRef] = pbxFileReferenceObj(file);
    this.pbxFileReferenceSection()[commentKey] = pbxFileReferenceComment(file);
}

pbxProject.prototype.addToPluginsPbxGroup = function (file) {
    var pluginsGroup = this.pbxGroupByName('Plugins');
    pluginsGroup.children.push(pbxGroupChild(file));
}

pbxProject.prototype.addToPbxSourcesBuildPhase = function (file) {
    var sources = this.pbxSourcesBuildPhaseObj();
    sources.files.push(pbxBuildPhaseObj(file));
}

pbxProject.prototype.addToPbxResourcesBuildPhase = function (file) {
    var sources = this.pbxResourcesBuildPhaseObj();
    sources.files.push(pbxBuildPhaseObj(file));
}

// helper access functions
pbxProject.prototype.pbxBuildFileSection = function () {
    return this.hash.project.objects['PBXBuildFile'];
}

pbxProject.prototype.pbxFileReferenceSection = function () {
    return this.hash.project.objects['PBXFileReference'];
}

pbxProject.prototype.pbxGroupByName = function (name) {
    var groups = this.hash.project.objects['PBXGroup'],
        key, groupKey;

    for (key in groups) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        if (groups[key] == name) {
            groupKey = key.split(COMMENT_KEY)[0];
            return groups[groupKey];
        }
    }

    return null;
}

pbxProject.prototype.pbxSourcesBuildPhaseSection = function () {
    return this.hash.project.objects['PBXSourcesBuildPhase'];
}

pbxProject.prototype.pbxSourcesBuildPhaseObj = function () {
    var section = this.pbxSourcesBuildPhaseSection(),
        obj, sectionKey;

    for (key in section) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        if (section[key] == 'Sources') {
            sectionKey = key.split(COMMENT_KEY)[0];
            return section[sectionKey];
        }
    }

    return null;
}

pbxProject.prototype.pbxResourcesBuildPhaseSection = function () {
    return this.hash.project.objects['PBXResourcesBuildPhase'];
}

pbxProject.prototype.pbxResourcesBuildPhaseObj = function () {
    var section = this.pbxResourcesBuildPhaseSection(),
        obj, sectionKey;

    for (key in section) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        if (section[key] == 'Resources') {
            sectionKey = key.split(COMMENT_KEY)[0];
            return section[sectionKey];
        }
    }

    return null;
}

// helper object creation functions
function pbxBuildFileObj(file) {
    var obj = Object.create(null);

    obj.isa = 'PBXBuildFile';
    obj.fileRef = file.fileRef;
    obj.fileRef_comment = file.basename;

    return obj;
}

function pbxFileReferenceObj(file) {
    var obj = Object.create(null);

    obj.isa = 'PBXFileReference';
    obj.lastKnownFileType = file.lastType;
    obj.name = file.basename;
    obj.path = file.path;
    obj.sourceTree = file.sourceTree;

    if (file.fileEncoding)
        obj.fileEncoding = file.fileEncoding;

    return obj;
}

function pbxGroupChild(file) {
    var obj = Object.create(null);

    obj.value = file.fileRef;
    obj.comment = file.basename;

    return obj;
}

function pbxBuildPhaseObj(file) {
    var obj = Object.create(null);

    obj.value = file.uuid;
    obj.comment = longComment(file);

    return obj;
}

function pbxBuildFileComment(file) {
    return longComment(file);
}

function pbxFileReferenceComment(file) {
    return file.basename;
}

function longComment(file) {
    return f("%s in %s", file.basename, file.group);
}

module.exports = pbxProject;
