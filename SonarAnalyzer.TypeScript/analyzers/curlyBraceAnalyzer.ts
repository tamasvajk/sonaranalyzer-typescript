import * as ts from "typescript";
import { Issue } from './issue';
import { IAnalyzerBase } from './iAnalyzerBase';

export class CurlyBraceAnalyzer implements IAnalyzerBase
{
    public AnalyzeNode(node: ts.Node, typeChecker: ts.TypeChecker): Issue[] {
        var issue: Issue = null;
        switch (node.kind) {
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.DoStatement:
                if ((<ts.IterationStatement>node).statement.kind !== ts.SyntaxKind.Block) {
                    issue = new Issue();
                    issue.node = node;
                    issue.message = "A looping statement's contents should be wrapped in a block body.";
                }
                break;

            case ts.SyntaxKind.IfStatement:
                let ifStatement = (<ts.IfStatement>node);
                if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
                    issue = new Issue();
                    issue.node = node;
                    issue.message = "An if statement's contents should be wrapped in a block body.";
                }
                if (ifStatement.elseStatement &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement) {
                    issue = new Issue();
                    issue.node = ifStatement.elseStatement;
                    issue.message = "An else statement's contents should be wrapped in a block body.";
                }
                break;
        }

        var issues: Issue[] = [];
        if (issue != null) {
            issues.push(issue);
        }

        return issues;
    }
}