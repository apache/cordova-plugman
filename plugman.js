/*
 *
 * Copyright 2013 Anis Kadri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

// copyright (c) 2013 Andrew Lunny, Adobe Systems

var emitter = require('./src/events');

module.exports = {
    help:           require('./src/help'),
    install:        require('./src/install'),
    uninstall:      require('./src/uninstall'),
    fetch:          require('./src/fetch'),
    prepare:        require('./src/prepare'),
    config_changes: require('./src/util/config-changes'),
    on:             emitter.addListener,
    off:            emitter.removeListener,
    removeAllListeners: emitter.removeAllListeners,
    emit:           emitter.emit
};
