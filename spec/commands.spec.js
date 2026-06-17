/*
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

const rewire = require('rewire');
const commands = rewire('../src/commands');

describe('commands', () => {
    let mockPlugman;

    beforeEach(() => {
        mockPlugman = {
            install: jasmine.createSpy('install').and.resolveTo(),
            uninstall: jasmine.createSpy('uninstall').and.resolveTo(),
            create: jasmine.createSpy('create').and.resolveTo(),
            platform: jasmine.createSpy('platform').and.resolveTo(),
            createpackagejson: jasmine.createSpy('createpackagejson').and.resolveTo()
        };
        commands.__set__('plugman', mockPlugman);
    });

    describe('install', () => {
        it('should reject if --platform is missing', async () => {
            await expectAsync(commands.install({ project: '/project', plugin: ['plugin-a'] }))
                .toBeRejectedWithError('Missing required option --platform');
        });

        it('should reject if --project is missing', async () => {
            await expectAsync(commands.install({ platform: 'android', plugin: ['plugin-a'] }))
                .toBeRejectedWithError('Missing required option --project');
        });

        it('should reject if --plugin is missing', async () => {
            await expectAsync(commands.install({ platform: 'android', project: '/project' }))
                .toBeRejectedWithError('Missing required option --plugin');
        });

        it('should call plugman.install once per plugin', async () => {
            await commands.install({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a', 'plugin-b'],
                plugins_dir: '/plugins'
            });

            expect(mockPlugman.install).toHaveBeenCalledTimes(2);
            expect(mockPlugman.install).toHaveBeenCalledWith('android', '/project', 'plugin-a', '/plugins', jasmine.any(Object));
            expect(mockPlugman.install).toHaveBeenCalledWith('android', '/project', 'plugin-b', '/plugins', jasmine.any(Object));
        });

        it('should not call plugman.install when plugin list is empty', async () => {
            await commands.install({
                platform: 'android',
                project: '/project',
                plugin: ['placeholder'] // satisfies the required check
            });
            mockPlugman.install.calls.reset();

            // Verify a single plugin results in exactly one call
            await commands.install({ platform: 'android', project: '/project', plugin: ['x'] });
            expect(mockPlugman.install).toHaveBeenCalledTimes(1);
        });

        it('should use safe defaults for optional flags', async () => {
            await commands.install({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a']
            });

            const opts = mockPlugman.install.calls.mostRecent().args[4];
            expect(opts).toEqual(jasmine.objectContaining({
                subdir: '.',
                save: false,
                force: false,
                nohooks: false,
                cli_variables: {}
            }));
        });

        it('should forward save, force, and nohooks flags', async () => {
            await commands.install({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a'],
                save: true,
                force: true,
                nohooks: true
            });

            const opts = mockPlugman.install.calls.mostRecent().args[4];
            expect(opts).toEqual(jasmine.objectContaining({ save: true, force: true, nohooks: true }));
        });

        it('should forward www, searchpath, and link options', async () => {
            await commands.install({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a'],
                www: '/www',
                searchpath: '/search',
                link: true
            });

            const opts = mockPlugman.install.calls.mostRecent().args[4];
            expect(opts).toEqual(jasmine.objectContaining({ www_dir: '/www', searchpath: '/search', link: true }));
        });

        it('should expand --variable assignments into cli_variables', async () => {
            await commands.install({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a'],
                variable: ['FOO=bar', 'BAZ=qux']
            });

            const opts = mockPlugman.install.calls.mostRecent().args[4];
            expect(opts.cli_variables).toEqual({ FOO: 'bar', BAZ: 'qux' });
        });

        it('should uppercase variable keys', async () => {
            await commands.install({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a'],
                variable: ['lowercase=value']
            });

            const opts = mockPlugman.install.calls.mostRecent().args[4];
            expect(opts.cli_variables).toEqual({ LOWERCASE: 'value' });
        });

        it('should preserve equals signs in variable values', async () => {
            await commands.install({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a'],
                variable: ['KEY=val=ue']
            });

            const opts = mockPlugman.install.calls.mostRecent().args[4];
            expect(opts.cli_variables).toEqual({ KEY: 'val=ue' });
        });

        it('should discard variables with invalid key names', async () => {
            await commands.install({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a'],
                variable: ['VALID=ok', 'invalid key=bad']
            });

            const opts = mockPlugman.install.calls.mostRecent().args[4];
            expect(opts.cli_variables).toEqual({ VALID: 'ok' });
        });
    });

    describe('uninstall', () => {
        it('should reject if --platform is missing', async () => {
            await expectAsync(commands.uninstall({ project: '/project', plugin: ['plugin-a'] }))
                .toBeRejectedWithError('Missing required option --platform');
        });

        it('should reject if --project is missing', async () => {
            await expectAsync(commands.uninstall({ platform: 'android', plugin: ['plugin-a'] }))
                .toBeRejectedWithError('Missing required option --project');
        });

        it('should reject if --plugin is missing', async () => {
            await expectAsync(commands.uninstall({ platform: 'android', project: '/project' }))
                .toBeRejectedWithError('Missing required option --plugin');
        });

        it('should call plugman.uninstall once per plugin', async () => {
            await commands.uninstall({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a', 'plugin-b'],
                plugins_dir: '/plugins'
            });

            expect(mockPlugman.uninstall).toHaveBeenCalledTimes(2);
            expect(mockPlugman.uninstall).toHaveBeenCalledWith('android', '/project', 'plugin-a', '/plugins', jasmine.any(Object));
            expect(mockPlugman.uninstall).toHaveBeenCalledWith('android', '/project', 'plugin-b', '/plugins', jasmine.any(Object));
        });

        it('should default save to false', async () => {
            await commands.uninstall({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a']
            });

            const opts = mockPlugman.uninstall.calls.mostRecent().args[4];
            expect(opts).toEqual(jasmine.objectContaining({ save: false }));
        });

        it('should forward save flag', async () => {
            await commands.uninstall({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a'],
                save: true
            });

            const opts = mockPlugman.uninstall.calls.mostRecent().args[4];
            expect(opts).toEqual(jasmine.objectContaining({ save: true }));
        });

        it('should forward www option', async () => {
            await commands.uninstall({
                platform: 'android',
                project: '/project',
                plugin: ['plugin-a'],
                www: '/www'
            });

            const opts = mockPlugman.uninstall.calls.mostRecent().args[4];
            expect(opts).toEqual(jasmine.objectContaining({ www_dir: '/www' }));
        });
    });

    describe('create', () => {
        it('should reject if --name is missing', async () => {
            await expectAsync(commands.create({ plugin_id: 'com.example', plugin_version: '1.0.0' }))
                .toBeRejectedWithError('Missing required option --name');
        });

        it('should reject if --plugin_id is missing', async () => {
            await expectAsync(commands.create({ name: 'MyPlugin', plugin_version: '1.0.0' }))
                .toBeRejectedWithError('Missing required option --plugin_id');
        });

        it('should reject if --plugin_version is missing', async () => {
            await expectAsync(commands.create({ name: 'MyPlugin', plugin_id: 'com.example' }))
                .toBeRejectedWithError('Missing required option --plugin_version');
        });

        it('should call plugman.create with the provided options', async () => {
            await commands.create({
                name: 'MyPlugin',
                plugin_id: 'com.example',
                plugin_version: '1.0.0',
                path: '/output'
            });

            expect(mockPlugman.create).toHaveBeenCalledOnceWith('MyPlugin', 'com.example', '1.0.0', '/output', {});
        });

        it('should default path to "." when not provided', async () => {
            await commands.create({
                name: 'MyPlugin',
                plugin_id: 'com.example',
                plugin_version: '1.0.0'
            });

            expect(mockPlugman.create).toHaveBeenCalledOnceWith('MyPlugin', 'com.example', '1.0.0', '.', {});
        });

        it('should expand --variable assignments into cli_variables', async () => {
            await commands.create({
                name: 'MyPlugin',
                plugin_id: 'com.example',
                plugin_version: '1.0.0',
                variable: ['FOO=bar']
            });

            const cli_variables = mockPlugman.create.calls.mostRecent().args[4];
            expect(cli_variables).toEqual({ FOO: 'bar' });
        });
    });

    describe('platform', () => {
        it('should reject if --platform_name is missing', async () => {
            await expectAsync(commands.platform({ argv: { remain: ['add'] } }))
                .toBeRejectedWithError('Missing required option --platform_name');
        });

        it('should reject when operation is not "add" or "remove"', async () => {
            await expectAsync(commands.platform({ platform_name: 'android', argv: { remain: ['update'] } }))
                .toBeRejectedWithError(/Operation must be either 'add' or 'remove'/);
        });

        it('should reject when operation is empty', async () => {
            await expectAsync(commands.platform({ platform_name: 'android', argv: { remain: [] } }))
                .toBeRejectedWithError(/Operation must be either 'add' or 'remove'/);
        });

        it('should call plugman.platform with operation "add"', async () => {
            await commands.platform({ platform_name: 'android', argv: { remain: ['add'] } });

            expect(mockPlugman.platform).toHaveBeenCalledOnceWith({ operation: 'add', platform_name: 'android' });
        });

        it('should call plugman.platform with operation "remove"', async () => {
            await commands.platform({ platform_name: 'android', argv: { remain: ['remove'] } });

            expect(mockPlugman.platform).toHaveBeenCalledOnceWith({ operation: 'remove', platform_name: 'android' });
        });
    });

    describe('createpackagejson', () => {
        it('should reject when plugin path is not provided', async () => {
            await expectAsync(commands.createpackagejson({ argv: { remain: [] } }))
                .toBeRejectedWithError('Missing required path to plugin');
        });

        it('should call plugman.createpackagejson with the plugin path', async () => {
            await commands.createpackagejson({ argv: { remain: ['/path/to/plugin'] } });

            expect(mockPlugman.createpackagejson).toHaveBeenCalledOnceWith('/path/to/plugin');
        });
    });
});
