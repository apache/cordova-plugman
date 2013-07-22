var plugman     = require('../plugman'),
    path        = require('path'),
    fs          = require('fs'),
    shell       = require('shelljs'),
    temp        = path.join(__dirname, "..", ".tmp"),
    plugins_dir = path.join(temp, 'plugins');

describe("integration", function () {
    beforeEach(function () {
        if ( !fs.existsSync(temp)) {
            shell.mkdir("-p", temp);
        }
    });
    describe("local non-root depdencies", function () {
        var project_src = path.join(__dirname, "projects", "android_one", "*"),
            plugin_src = path.join(__dirname, "plugins", "dependencies", "B"),
            project_dir = path.join(temp, "android");

        beforeEach(function () {
            shell.cp("-rf", project_src, project_dir);
        });

        it("should install dependencies from github", function () {
            var flag = false,
                installData;

            runs(function () {
                plugman.install('android', project_dir, plugin_src, plugins_dir, {}, function (error) {
                    expect(error).not.toBeDefined();
                    flag = true;
                });
            });
            waitsFor(function () { return flag; }, "plugman install to finish", 10000);
            runs(function () {
                installData = require(path.join(plugins_dir, "android.json"));
                expect(installData.installed_plugins).toEqual({ 'B': { PACKAGE_NAME: 'com.alunny.childapp'}});
                expect(installData.dependent_plugins).toEqual({
                    'D' : { PACKAGE_NAME: 'com.alunny.childapp'},
                    'E': { PACKAGE_NAME: 'com.alunny.childapp'}
                });
            });
            //Cleanup
            this.after(function () {
                shell.rm("-rf", project_dir);
            });
        });
    });

    describe("blackberry10", function () {
        var project_src = path.join(__dirname, "projects", "blackberry10", "*"),
            plugin_src = path.join(__dirname, "plugins", "Contacts"),
            project_dir = path.join(temp, "blackberry10");

        beforeEach(function () {
            shell.cp("-rf", project_src, project_dir);
        });

        it("should install dependencies from github", function () {
            var flag = false,
                installData;

            runs(function () {
                plugman.install('blackberry10', project_dir, plugin_src, plugins_dir, {}, function (error) {
                    expect(error).not.toBeDefined();
                    flag = true;
                });
            });
            waitsFor(function () { return flag; }, "plugman install to finish", 10000);
            runs(function () {
                installData = require(path.join(plugins_dir, "blackberry10.json"));
                expect(installData.installed_plugins).toEqual({ 'org.apache.cordova.core.contacts': { PACKAGE_NAME: 'cordovaExample'}});
                expect(installData.dependent_plugins).toEqual({
                    'com.blackberry.utils' : { PACKAGE_NAME: 'cordovaExample'},
                    'org.apache.cordova.blackberry10.pimlib': { PACKAGE_NAME: 'cordovaExample'}
                });
            });
            //Cleanup
            this.after(function () {
                shell.rm("-rf", project_dir);
                shell.rm("-rf", temp);
            });
        });
    });

});
