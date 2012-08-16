// compare two et.XML nodes, see if they match
// currently ignores text and children
module.exports = function equalNodes(one, two) {
    if (one.tag != two.tag) {
        return false;
    }

    var oneAttribKeys = Object.keys(one.attrib),
        twoAttribKeys = Object.keys(two.attrib),
        i = 0, attribName;

    if (oneAttribKeys.length != twoAttribKeys.length) {
        return false;
    }

    for (i; i < oneAttribKeys.length; i++) {
        attribName = oneAttribKeys[i];

        if (one.attrib[attribName] != two.attrib[attribName]) {
            return false;
        }
    }

    return true;
}
