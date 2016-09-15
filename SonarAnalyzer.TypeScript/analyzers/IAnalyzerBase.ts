import * as ts from "typescript";
import { Issue } from './issue';

export interface IAnalyzerBase
{
    AnalyzeNode(node: ts.Node, typeChecker: ts.TypeChecker): Issue[]
}