/**
 * LuaParser - Advanced Code Parser & Formatter
 * Handles multiple languages with intelligent formatting and analysis
 */

class CodeParser {
    constructor() {
        this.keywords = {
            lua: ['if', 'then', 'else', 'elseif', 'end', 'for', 'while', 'do', 'return', 'function', 'local', 'nil', 'true', 'false', 'and', 'or', 'not'],
            javascript: ['if', 'else', 'for', 'while', 'function', 'const', 'let', 'var', 'return', 'class', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this'],
            python: ['if', 'else', 'elif', 'for', 'while', 'def', 'class', 'return', 'import', 'from', 'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'pass', 'break', 'continue'],
        };
        this.indentLevel = 0;
        this.formatted = '';
    }

    /**
     * Main beautify function - formats code with proper indentation and spacing
     */
    beautify(code, language = 'javascript') {
        this.formatted = '';
        this.indentLevel = 0;
        const lines = code.split('\n');
        
        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed === '') {
                this.formatted += '\n';
                continue;
            }

            // Decrease indent for closing brackets
            if (this.startsWithClosing(trimmed)) {
                this.indentLevel = Math.max(0, this.indentLevel - 1);
            }

            // Add indented line
            this.formatted += this.getIndent() + trimmed + '\n';

            // Increase indent for opening brackets
            if (this.endsWithOpening(trimmed)) {
                this.indentLevel++;
            }
        }

        return this.formatted.trimEnd();
    }

    /**
     * Advanced formatting with language-specific rules
     */
    advancedFormat(code, language = 'javascript') {
        let result = code;

        if (language === 'javascript') {
            result = this.formatJavaScript(result);
        } else if (language === 'python') {
            result = this.formatPython(result);
        } else if (language === 'lua') {
            result = this.formatLua(result);
        } else if (language === 'html') {
            result = this.formatHTML(result);
        }

        return this.beautify(result, language);
    }

    /**
     * JavaScript-specific formatting
     */
    formatJavaScript(code) {
        // Add space after keywords
        code = code.replace(/\b(if|else|for|while|switch|catch)\b(?!\s*\()/g, '$1 ');
        
        // Format object literals
        code = code.replace(/{\s*/g, '{ ');
        code = code.replace(/\s*}/g, ' }');
        
        // Format function arguments
        code = code.replace(/\(\s*/g, '(');
        code = code.replace(/\s*\)/g, ')');
        
        // Add spaces around operators
        code = code.replace(/([^=!<>+\-*/])(=|==|===|!=|!==|<=|>=)([^=])/g, '$1 $2 $3');
        
        return code;
    }

    /**
     * Python-specific formatting
     */
    formatPython(code) {
        // Add space after keywords
        code = code.replace(/\b(if|else|elif|for|while|def|class|try|except|finally)\b(?!:)/g, '$1 ');
        
        // Ensure colons are followed by newline
        code = code.replace(/:\s*([^\n])/g, ':\n$1');
        
        return code;
    }

    /**
     * Lua-specific formatting
     */
    formatLua(code) {
        // Add space after keywords
        code = code.replace(/\b(if|then|else|elseif|end|for|while|do|function|local)\b/g, '$1 ');
        
        // Clean up double spaces
        code = code.replace(/\s+/g, ' ');
        
        return code;
    }

    /**
     * HTML-specific formatting
     */
    formatHTML(code) {
        // Basic HTML formatting
        code = code.replace(/<(\w+)/g, '\n<$1');
        code = code.replace(/>/g, '>\n');
        code = code.replace(/\n\s*\n/g, '\n');
        
        return code;
    }

    /**
     * Analyze code for syntax issues
     */
    analyzeCode(code, language = 'javascript') {
        const issues = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check for common issues
            if (this.hasSyntaxIssue(line, language)) {
                issues.push({
                    line: i + 1,
                    message: 'Potential syntax issue detected',
                    severity: 'warning'
                });
            }

            // Check for missing semicolons (JavaScript)
            if (language === 'javascript' && this.shouldHaveSemicolon(line)) {
                issues.push({
                    line: i + 1,
                    message: 'Missing semicolon',
                    severity: 'warning'
                });
            }

            // Check for unmatched brackets
            if (this.hasUnmatchedBrackets(line)) {
                issues.push({
                    line: i + 1,
                    message: 'Unmatched brackets detected',
                    severity: 'error'
                });
            }
        }

        // Check overall bracket balance
        if (!this.areBracketsBalanced(code)) {
            issues.push({
                line: 0,
                message: 'Brackets are not balanced',
                severity: 'error'
            });
        }

        return issues;
    }

    /**
     * Performance analysis of code
     */
    analyzePerformance(code) {
        const metrics = {
            lines: code.split('\n').length,
            functions: (code.match(/function|\s*\(\s*\)\s*=>/g) || []).length,
            loops: (code.match(/for|while|forEach/g) || []).length,
            nestedLevels: this.calculateNestingLevel(code),
            recommendations: []
        };

        if (metrics.nestedLevels > 4) {
            metrics.recommendations.push('Consider reducing nesting levels for better readability');
        }

        if (metrics.lines > 500) {
            metrics.recommendations.push('File is large. Consider splitting into modules');
        }

        if (metrics.loops > 5) {
            metrics.recommendations.push('Multiple loops detected. Ensure efficient algorithms');
        }

        return metrics;
    }

    /**
     * Security analysis
     */
    analyzeSecurtiy(code) {
        const issues = [];

        const securityPatterns = [
            { pattern: /eval\(/g, message: 'Avoid eval() - Security risk' },
            { pattern: /innerHTML/g, message: 'innerHTML can be a security risk - use textContent' },
            { pattern: /document\.write/g, message: 'document.write is deprecated' },
            { pattern: /onclick\s*=/g, message: 'Inline event handlers are insecure - use addEventListener' },
            { pattern: /fetch\s*\([^,]*\)/g, message: 'Ensure CORS and HTTPS for API calls' },
        ];

        for (const sec of securityPatterns) {
            const matches = code.match(sec.pattern);
            if (matches) {
                issues.push({
                    pattern: sec.pattern.toString(),
                    message: sec.message,
                    count: matches.length
                });
            }
        }

        return issues;
    }

    // Helper methods
    startsWithClosing(line) {
        return /^[}\])]/.test(line);
    }

    endsWithOpening(line) {
        return /[{(\[]$/.test(line);
    }

    getIndent() {
        return '  '.repeat(this.indentLevel);
    }

    hasSyntaxIssue(line, language) {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('#')) return false;
        
        return /[^a-zA-Z0-9_\s\(\)\{\}\[\];:,\.'"=+\-*/<>!&|?]/.test(trimmed);
    }

    shouldHaveSemicolon(line) {
        const trimmed = line.trim();
        return !trimmed.endsWith(';') && !trimmed.endsWith('{') && 
               !trimmed.endsWith('}') && trimmed !== '' && 
               !trimmed.startsWith('//');
    }

    hasUnmatchedBrackets(line) {
        const open = (line.match(/[{(\[]/g) || []).length;
        const close = (line.match(/[}\]\)]/g) || []).length;
        return open !== close;
    }

    areBracketsBalanced(code) {
        let balance = 0;
        for (const char of code) {
            if (char === '{' || char === '(' || char === '[') balance++;
            if (char === '}' || char === ')' || char === ']') balance--;
            if (balance < 0) return false;
        }
        return balance === 0;
    }

    calculateNestingLevel(code) {
        let maxNesting = 0;
        let currentNesting = 0;
        
        for (const char of code) {
            if (char === '{' || char === '(' || char === '[') {
                currentNesting++;
                maxNesting = Math.max(maxNesting, currentNesting);
            } else if (char === '}' || char === ')' || char === ']') {
                currentNesting--;
            }
        }
        
        return maxNesting;
    }

    /**
     * Get syntax highlighting class for tokens
     */
    highlightSyntax(code, language) {
        let highlighted = code;

        // Highlight strings
        highlighted = highlighted.replace(/(['"`])(.*?)\1/g, '<span class="string">$&</span>');

        // Highlight comments
        highlighted = highlighted.replace(/\/\/(.*?)$/gm, '<span class="comment">//$1</span>');
        highlighted = highlighted.replace(/\/\*(.*?)\*\//gs, '<span class="comment">/*$1*/</span>');

        // Highlight keywords
        if (this.keywords[language]) {
            this.keywords[language].forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
            });
        }

        // Highlight numbers
        highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');

        // Highlight functions
        highlighted = highlighted.replace(/\b(\w+)(?=\s*\()/g, '<span class="function">$1</span>');

        return highlighted;
    }
}

// Export for use in app.js
const parser = new CodeParser();
