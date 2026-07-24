ClaudeCode — Universal AI Beautifier & Deobfuscator
A beautiful, Claude-inspired universal code beautifier, deobfuscator, and AI coding assistant that runs
entirely in your browser.
Features
• 12 Languages Supported: JavaScript, TypeScript, Lua, Luau, WAT, WASM, HTML, CSS,
SCSS, JSON, Python, SQL
• AI-Powered Beautification: Intelligent formatting with language-specific heuristics
• Deobfuscation: Restore obfuscated JavaScript and Lua code to readable form
• Syntax Fixing: Automatically correct common syntax errors
• WASM Compilation: Generate WAT and WASM binary output from JavaScript
• AST Visualization: View the Abstract Syntax Tree of your code
• Diff View: See before/after comparison
• Drag & Drop: Drop code files anywhere to load them
• AI Chat Assistant: Ask questions about your code
• Keyboard Shortcuts: Ctrl+Enter to process, Ctrl+S to export, etc.
Files
File Description
index.html Main application shell
style.css Claude-inspired dark theme stylesheet
app.js Core engine: tokenizer, beautifier, deobfuscator, syntax fixer, minifier,
WASM compiler, AST generator, diff generator
lua-parser.js Full Lua/Luau tokenizer, parser, AST builder, and beautifier
Usage
1. Open index.html in any modern browser
2. Paste code or drag & drop a file
3. Select your language from the sidebar
4. Toggle AI features (Beautify, Lint, Deobfuscate, Minify, WASM)
5. Click Beautify & Fix or press Ctrl+Enter
6. View results in the Output, WAT, WASM, AST, or Diff tabs
Keyboard Shortcuts
Shortcut Action
Ctrl + Enter Process code
Ctrl + S Export output
Ctrl + K Clear all
Ctrl + L Load sample
Ctrl + D Deobfuscate
