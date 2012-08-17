// compare two et.XML nodes, see if they match
// compares tagName, text, attributes and children (recursively)
module.exports = function equalNodes(one, two) {
    if (one.tag != two.tag) {
        return false;
    } else if (one.text.trim() != two.text.trim()) {
        return false;
    } else if (one._children.length != two._children.length) {
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

    for (i; i < one._children.length; i++) {
        if (!equalNodes(one._children[i], two._children[i])) {
            return false;
        }
    }

    return true;
}
