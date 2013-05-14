var stack = [];
var completed = [];

module.exports = {
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
        stack.push(tx);
    },
    process:function(callback) {
        while(stack.length) {
            var action = stack.shift();
            var handler = action.handler.run;
            var action_params = action.handler.params;
            try {
                handler.apply(null, action_params);
            } catch(e) {
                var incomplete = stack.unshift(action);
                var issue = 'Install failed!\n';
                // revert completed tasks
                while(completed.length) {
                    var undo = completed.shift();
                    var revert = undo.reverter.run;
                    var revert_params = undo.reverter.params;
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
            completed.push(action);
        }
        if (callback) callback();
    }
};
