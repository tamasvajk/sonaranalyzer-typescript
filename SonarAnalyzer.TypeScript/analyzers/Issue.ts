import * as ts from "typescript";

export class Issue
{
    public node: ts.Node;
    public message: string;
}