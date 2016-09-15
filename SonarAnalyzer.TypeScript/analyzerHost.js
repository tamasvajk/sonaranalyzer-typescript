"use strict";
var ts = require("typescript");
var fs = require("fs");
var curlyBraceAnalyzer_1 = require('./analyzers/curlyBraceAnalyzer');
var AnalyzerHost = (function () {
    function AnalyzerHost() {
    }
    AnalyzerHost.prototype.analyzeFiles = function (filePaths, writer) {
        // todo this doesn't handle file additions and removals
        var _this = this;
        var program = ts.createProgram(filePaths, {
            target: ts.ScriptTarget.ES6,
            module: ts.ModuleKind.CommonJS
        });
        var typeChecker = program.getTypeChecker();
        var sourceFiles = program.getSourceFiles();
        sourceFiles.forEach(function (file) {
            if (file.isDeclarationFile) {
                return;
            }
            var fileIssues = _this.analyzeFile(file, typeChecker);
            fileIssues.forEach(function (issue) {
                writer(AnalyzerHost.print(issue));
            });
            var fn = file.fileName.split('/').join('\\');
            fs.watchFile(fn, { persistent: true, interval: 250 }, function (curr, prev) {
                // Check timestamp
                if (+curr.mtime <= +prev.mtime) {
                    return;
                }
                // todo should remove here the previously reported issues
                // todo update the typechecker
                program = ts.createProgram(filePaths, {
                    target: ts.ScriptTarget.ES6,
                    module: ts.ModuleKind.CommonJS
                });
                typeChecker = program.getTypeChecker();
                sourceFiles = program.getSourceFiles();
                sourceFiles.forEach(function (file) {
                    if (file.isDeclarationFile ||
                        file.fileName.split('/').join('\\') != fn) {
                        return;
                    }
                    var fileIssues = _this.analyzeFile(file, typeChecker);
                    fileIssues.forEach(function (issue) {
                        writer(AnalyzerHost.print(issue));
                    });
                });
            });
        });
        return '';
    };
    AnalyzerHost.prototype.analyzeFilesOnce = function (filePaths) {
        var program = ts.createProgram(filePaths, {
            target: ts.ScriptTarget.ES6,
            module: ts.ModuleKind.CommonJS
        });
        var typeChecker = program.getTypeChecker();
        var issues = [];
        var sourceFiles = program.getSourceFiles();
        for (var i = 0; i < sourceFiles.length; i++) {
            if (sourceFiles[i].isDeclarationFile) {
                continue;
            }
            var fileIssues = this.analyzeFile(sourceFiles[i], typeChecker);
            issues.push.apply(issues, fileIssues);
        }
        var messages = [];
        issues.forEach(function (issue) {
            messages.push(AnalyzerHost.print(issue));
        });
        return messages.join();
    };
    AnalyzerHost.print = function (issue) {
        var sourceFile = issue.node.getSourceFile();
        var lineAndChar = sourceFile.getLineAndCharacterOfPosition(issue.node.getStart());
        return issue.message + ' |||| at L' + (lineAndChar.line + 1) + ' C' + lineAndChar.character +
            ' (...' + sourceFile.fileName.substr(sourceFile.fileName.length - 25) + ') \n\r';
    };
    AnalyzerHost.prototype.analyzeFile = function (sourceFile, typeChecker) {
        return this.walk(sourceFile, typeChecker);
    };
    AnalyzerHost.prototype.walk = function (node, typeChecker) {
        var issues = [];
        for (var i = 0; i < AnalyzerHost.analyzers.length; i++) {
            var analyzerIssues = AnalyzerHost.analyzers[i].AnalyzeNode(node, typeChecker);
            issues.push.apply(issues, analyzerIssues);
        }
        var children = node.getChildren();
        for (var i = 0; i < children.length; i++) {
            var childIssues = this.walk(children[i], typeChecker);
            issues.push.apply(issues, childIssues);
        }
        return issues;
    };
    //let sourceFile = ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES6, /*setParentNodes */ true);
    AnalyzerHost.analyzers = [new curlyBraceAnalyzer_1.CurlyBraceAnalyzer()];
    return AnalyzerHost;
}());
exports.AnalyzerHost = AnalyzerHost;
//# sourceMappingURL=analyzerHost.js.map