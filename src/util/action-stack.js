var ios = require('../platforms/ios'),
    fs = require('fs');

function ActionStack() {
    this.stack = [];
    this.completed = [];
}

ActionStack.prototype = {
    createAction:function(handler, action_params, reverter, revert_params) {
        return {
            handler:{
                run:handler,
                params:action_params
            },
            reverter:{
                run:reverter,
                params:revert_params
            }
        };
    },
    push:function(tx) {
        this.stack.push(tx);
    },
    process:function(platform, project_dir, callback) {
        if (platform == 'ios') {
            // parse xcode project files once
            var project_files = ios.parseIOSProjectFiles(project_dir);
        }
        while(this.stack.length) {
            var action = this.stack.shift();
            var handler = action.handler.run;
            var action_params = action.handler.params;
            if (platform == 'ios') action_params.push(project_files);
            try {
                handler.apply(null, action_params);
            } catch(e) {
                var incomplete = this.stack.unshift(action);
                var issue = 'Uh oh!\n';
                // revert completed tasks
                while(this.completed.length) {
                    var undo = this.completed.shift();
                    var revert = undo.reverter.run;
                    var revert_params = undo.reverter.params;
                    if (platform == 'ios') revert_params.push(project_files);
                    try {
                        revert.apply(null, revert_params);
                    } catch(err) {
                        issue += 'A reversion action failed: ' + err.message + '\n';
                    }
                }
                e.message = issue + e.message;
                if (callback) callback(e);
                else throw e;
                return;
            }
            this.completed.push(action);
        }
        if (platform == 'ios') {
            // write out xcodeproj file
            fs.writeFileSync(project_files.pbx, project_files.xcode.writeSync());
        }
        if (callback) callback();
    }
};

module.exports = ActionStack;
