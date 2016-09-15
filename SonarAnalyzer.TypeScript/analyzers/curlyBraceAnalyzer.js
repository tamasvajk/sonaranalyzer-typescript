"use strict";
var ts = require("typescript");
var issue_1 = require('./issue');
var CurlyBraceAnalyzer = (function () {
    function CurlyBraceAnalyzer() {
    }
    CurlyBraceAnalyzer.prototype.AnalyzeNode = function (node, typeChecker) {
        var issue = null;
        switch (node.kind) {
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.DoStatement:
                if (node.statement.kind !== ts.SyntaxKind.Block) {
                    issue = new issue_1.Issue();
                    issue.node = node;
                    issue.message = "A looping statement's contents should be wrapped in a block body.";
                }
                break;
            case ts.SyntaxKind.IfStatement:
                var ifStatement = node;
                if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
                    issue = new issue_1.Issue();
                    issue.node = node;
                    issue.message = "An if statement's contents should be wrapped in a block body.";
                }
                if (ifStatement.elseStatement &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement) {
                    issue = new issue_1.Issue();
                    issue.node = ifStatement.elseStatement;
                    issue.message = "An else statement's contents should be wrapped in a block body.";
                }
                break;
        }
        var issues = [];
        if (issue != null) {
            issues.push(issue);
        }
        return issues;
    };
    return CurlyBraceAnalyzer;
}());
exports.CurlyBraceAnalyzer = CurlyBraceAnalyzer;
//# sourceMappingURL=curlyBraceAnalyzer.js.map