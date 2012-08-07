// takes an xml list of config-file tags
// returns a JS object with an easy to use structure

module.exports = function configChanges(baseTag) {
    var tags = baseTag.findall('./config-file'),
        files = {};

    tags.forEach(function (tag) {
        var target = tag.attrib['target'];

        if (files[target]) {
            files[target].push(tag);
        } else {
            files[target] = [tag];
        }
    });

    return files;
}
