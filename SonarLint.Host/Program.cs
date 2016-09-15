using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.MSBuild;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Management;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace SonarLint.Host
{
    static class Program
    {
        private const int analyzerPort = 1339;
        private static Process process;

        static void Main()
        {
            StartSonarAnalyzer();

            ThreadStart ths = () =>
            {
                Console.ReadKey();
                KillChildProcesses(process);
                Process.GetCurrentProcess().Kill();
            };
            Thread th = new Thread(ths);
            th.Start();

            ConnectToAnalyzer();
        }

        private static void KillChildProcesses(Process process)
        {
            foreach (Process childProcess in process.GetChildProcesses())
            {
                KillChildProcesses(childProcess);
                childProcess.Kill();
            }
        }

        public static IEnumerable<Process> GetChildProcesses(this Process process)
        {
            var mos = new ManagementObjectSearcher(
                string.Format("Select * From Win32_Process Where ParentProcessID={0}",
                process.Id));

            foreach (var mo in mos.Get())
            {
                yield return Process.GetProcessById(Convert.ToInt32(mo["ProcessID"]));
            }
        }

        private static void ConnectToAnalyzer()
        {
            // todo: wait for node to start:
            Thread.Sleep(1000);
            using (var client = new TcpClient("127.0.0.1", analyzerPort))
            {
                using (var stream = client.GetStream())
                {
                    var solutionPath = @"..\..\..\Samples\SampleSolution\SampleSolution.sln";
                    Console.Write(@"Solution: " + solutionPath);

                    Console.WriteLine();

                    var typeScriptFilePaths = GetTypeScriptFilesFrom(solutionPath).ToList();

                    var message = JsonConvert.SerializeObject(typeScriptFilePaths);

                    var data = Encoding.ASCII.GetBytes(message);
                    stream.Write(data, 0, data.Length);

                    const int bufferSize = 256;
                    data = new byte[bufferSize];
                    int length;
                    while ((length = stream.Read(data, 0, data.Length)) != 0)
                    {
                        var responseData = Encoding.ASCII.GetString(data, 0, length);
                        Console.Write(responseData);
                    }
                }
            }
        }

        private static IEnumerable<string> GetTypeScriptFilesFrom(string solutionPath)
        {
            var w = MSBuildWorkspace.Create();
            var sln = w.OpenSolutionAsync(solutionPath).Result;
            foreach (var project in sln.Projects)
            {
                var msbuildProject = new Microsoft.Build.Evaluation.Project(project.FilePath);
                var typeScriptCompileItems = msbuildProject.GetItems("TypeScriptCompile");
                foreach (var typeScriptFile in typeScriptCompileItems)
                {
                    yield return Path.Combine(msbuildProject.DirectoryPath, typeScriptFile.EvaluatedInclude);
                }
            }
        }

        private static void StartSonarAnalyzer()
        {
            var assemblyLocation = typeof(Program).Assembly.Location;
            var appPath = Path.Combine(assemblyLocation, @"..\..\..\..\SonarAnalyzer.TypeScript\app.js");
            var appFile = new FileInfo(appPath);
            var nodePath = Path.Combine(assemblyLocation, @"..\..\..\..\packages\Node.js.5.3.0\node.exe");
            var nodeFile = new FileInfo(nodePath);

            process = new Process();
            // Configure the process using the StartInfo properties.
            process.StartInfo.FileName = $"{nodeFile.FullName}";
            process.StartInfo.Arguments = $@"""{appFile.FullName}"" {analyzerPort}";

            ThreadStart ths = () => process.Start();
            Thread th = new Thread(ths);
            th.Start();
        }
    }
}
