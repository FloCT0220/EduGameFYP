"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const CHALLENGE = {
  prompt: "Write a function that returns the sum of two numbers.\n\nExample:\nInput: 2, 3\nOutput: 5",
  testInput: [2, 3],
  expectedOutput: "5"
};

const LANGUAGES = [
  { label: "Python", value: "python" },
  { label: "JavaScript", value: "javascript" },
  { label: "C", value: "c" }
];

const DEFAULT_CODE: { [key: string]: string } = {
  python: "def add(a, b):\n    # Write your code here\n    return 0\n\nprint(add(2, 3))",
  javascript: "function add(a, b) {\n  // Write your code here\n  return 0;\n}\n\nconsole.log(add(2, 3));",
  c: "#include <stdio.h>\n\nint add(int a, int b) {\n    // Write your code here\n    return 0;\n}\n\nint main() {\n    printf(\"%d\\n\", add(2, 3));\n    return 0;\n}"
};

export default function CodingSimPage() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULT_CODE["python"]);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<null | { success: boolean; message: string }>();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setOutput("");
    setResult(null);
  };

  // Placeholder run handler
  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setOutput("");
    // Simulate code execution and validation
    setTimeout(() => {
      // Fake validation: if code contains 'return a + b' or 'return a+b' or 'a + b' in any language, pass
      const pass = /return\s+a\s*\+\s*b|a\s*\+\s*b|add\(2,\s*3\)/.test(code);
      if (pass) {
        setOutput(CHALLENGE.expectedOutput);
        setResult({ success: true, message: "+10 points! Correct answer." });
      } else {
        setOutput("0");
        setResult({ success: false, message: "Incorrect. Try again!" });
      }
      setIsRunning(false);
    }, 800);
  };

  return (
    <div className="min-h-screen md:ml-64 p-6" style={{ background: 'var(--background-primary)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 bg-white/80 rounded-lg p-4">
          <h1 className="text-3xl font-bold mb-2">🖥️ Coding Simulators</h1>
          <p className="text-gray-700 mb-4">Practice your programming skills in-browser. Solve coding challenges and earn points!</p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-2">
            <div className="font-semibold text-blue-900 mb-1">Challenge:</div>
            <pre className="text-blue-800 whitespace-pre-wrap">{CHALLENGE.prompt}</pre>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
            <label className="font-medium text-gray-700">Language:</label>
            <select
              className="border rounded px-3 py-2 text-gray-800"
              value={language}
              onChange={handleLanguageChange}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
          <div className="h-96">
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={value => setCode(value || "")}
              theme="vs-dark"
              options={{ fontSize: 16, minimap: { enabled: false } }}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>
          <div className="bg-gray-900 text-green-200 rounded p-4 min-h-[80px] font-mono whitespace-pre-wrap">
            {output || "Output will appear here."}
          </div>
          {result && (
            <div className={`mt-2 p-3 rounded font-semibold ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 