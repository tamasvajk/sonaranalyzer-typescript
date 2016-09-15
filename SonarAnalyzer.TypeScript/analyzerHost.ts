import * as ts from "typescript";
import * as fs from "fs";
import { Issue } from './analyzers/issue';
import { IAnalyzerBase } from './analyzers/iAnalyzerBase';
import { CurlyBraceAnalyzer } from './analyzers/curlyBraceAnalyzer';

class AnalyzerHost
{
    public analyzeFiles(filePaths: string[], writer: (str: string) => any): string {

        // todo this doesn't handle file additions and removals

        var program = ts.createProgram(filePaths, {
            target: ts.ScriptTarget.ES6,
            module: ts.ModuleKind.CommonJS
        });

        var typeChecker = program.getTypeChecker();

        var sourceFiles = program.getSourceFiles();
        sourceFiles.forEach(file => {

            if (file.isDeclarationFile) {
                return;
            }

            var fileIssues = this.analyzeFile(file, typeChecker);
            fileIssues.forEach(issue => {
                writer(AnalyzerHost.print(issue));
            });

            var fn = file.fileName.split('/').join('\\');

            fs.watchFile(fn,
                { persistent: true, interval: 250 },
                (curr, prev) => {
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
                    sourceFiles.forEach(file => {

                        if (file.isDeclarationFile ||
                            file.fileName.split('/').join('\\') != fn) {
                            return;
                        }

                        var fileIssues = this.analyzeFile(file, typeChecker);
                        fileIssues.forEach(issue => {
                            writer(AnalyzerHost.print(issue));
                        });
                    });
                });
        });

        return '';
    }

    public analyzeFilesOnce(filePaths: string[]): string {

        var program = ts.createProgram(filePaths, {
            target: ts.ScriptTarget.ES6,
            module: ts.ModuleKind.CommonJS
        });

        var typeChecker = program.getTypeChecker();

        var issues: Issue[] = [];
        var sourceFiles = program.getSourceFiles();
        for (var i = 0; i < sourceFiles.length; i++) {
            if (sourceFiles[i].isDeclarationFile)
            {
                continue;
            }

            var fileIssues = this.analyzeFile(sourceFiles[i], typeChecker);
            issues.push(...fileIssues);
        }
        var messages: string[] = [];
        issues.forEach(issue => {
            messages.push(AnalyzerHost.print(issue));
        });

        return messages.join();
    }

    private static print(issue: Issue): string {
        var sourceFile = issue.node.getSourceFile();
        var lineAndChar = sourceFile.getLineAndCharacterOfPosition(issue.node.getStart());
        return issue.message + ' |||| at L' + (lineAndChar.line + 1) + ' C' + lineAndChar.character +
            ' (...' + sourceFile.fileName.substr(sourceFile.fileName.length - 25) + ') \n\r';
    }

    //let sourceFile = ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES6, /*setParentNodes */ true);

    private static analyzers: IAnalyzerBase[] = [ new CurlyBraceAnalyzer() ];

    private analyzeFile(sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker): Issue[]
    {
        return this.walk(sourceFile, typeChecker);
    }

    private walk(node: ts.Node, typeChecker: ts.TypeChecker): Issue[] {
        var issues: Issue[] = [];

        for (var i = 0; i < AnalyzerHost.analyzers.length; i++) {
            var analyzerIssues = AnalyzerHost.analyzers[i].AnalyzeNode(node, typeChecker);
            issues.push(...analyzerIssues);
        }

        var children = node.getChildren();
        for (var i = 0; i < children.length; i++) {
            var childIssues = this.walk(children[i], typeChecker);
            issues.push(...childIssues);
        }
        return issues;
    }
}

export { AnalyzerHost };