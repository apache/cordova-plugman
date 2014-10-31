/**
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
var nopt = require('nopt');

describe('nopt interface check', function() {
    // https://issues.apache.org/jira/browse/CB-7915
    it('parameters without assignment operator should be assigned', function() {
        var cli_opts = nopt(null, null, ['plugman', 'create', '--name', 'MyName', '--platform_id', 'MyId', '--platform_version','1.0.0']);
        expect(cli_opts.name).toEqual('MyName');
        expect(cli_opts.platform_id).toEqual('MyId');
        expect(cli_opts.platform_version).toEqual('1.0.0');
    });
});
