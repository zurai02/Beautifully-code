/**
 * CodeForge AI Studio - Main Application
 * Handles UI interactions, script generation, code analysis, and AI integration
 */

class CodeForgeApp {
    constructor() {
        this.currentLanguage = 'javascript';
        this.history = [];
        this.maxHistory = 50;
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.loadFromLocalStorage();
        this.showNotification('Welcome to CodeForge AI Studio! 🚀', 'info');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Beautify Tab
        this.codeInput = document.getElementById('codeInput');
        this.codeOutput = document.getElementById('codeOutput');
        this.codeHighlight = document.getElementById('codeHighlight');
        this.beautifyBtn = document.getElementById('beautifyBtn');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.languageSelect = document.getElementById('languageSelect');
        this.analysisContainer = document.getElementById('analysisContainer');
        this.issuesContainer = document.getElementById('issuesContainer');

        // Generate Tab
        this.scriptType = document.getElementById('scriptType');
        this.generatorLanguage = document.getElementById('generatorLanguage');
        this.scriptDescription = document.getElementById('scriptDescription');
        this.generateBtn = document.getElementById('generateBtn');
        this.generatedOutput = document.getElementById('generatedOutput');
        this.generatedHighlight = document.getElementById('generatedHighlight');
        this.copyGeneratedBtn = document.getElementById('copyGeneratedBtn');
        this.downloadGeneratedBtn = document.getElementById('downloadGeneratedBtn');
        this.templatesContainer = document.getElementById('templatesContainer');

        // Analyze Tab
        this.analysisInput = document.getElementById('analysisInput');
        this.fullAnalysisBtn = document.getElementById('fullAnalysisBtn');
        this.perfAnalysisBtn = document.getElementById('perfAnalysisBtn');
        this.securityAnalysisBtn = document.getElementById('securityAnalysisBtn');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.recommendationsContainer = document.getElementById('recommendationsContainer');

        // Other elements
        this.loader = document.getElementById('loader');
        this.toast = document.getElementById('toast');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Beautify Tab Events
        this.beautifyBtn.addEventListener('click', () => this.beautifyCode());
        this.analyzeBtn.addEventListener('click', () => this.analyzeWithAI());
        this.clearBtn.addEventListener('click', () => this.clearCode());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard(this.codeOutput.textContent));
        this.downloadBtn.addEventListener('click', () => this.downloadCode());
        this.languageSelect.addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            if (this.codeInput.value) this.beautifyCode();
        });

        // Generate Tab Events
        this.generateBtn.addEventListener('click', () => this.generateScript());
        this.copyGeneratedBtn.addEventListener('click', () => this.copyToClipboard(this.generatedOutput.textContent));
        this.downloadGeneratedBtn.addEventListener('click', () => this.downloadGeneratedScript());
        this.setupTemplateCards();

        // Analyze Tab Events
        this.fullAnalysisBtn.addEventListener('click', () => this.performFullAnalysis());
        this.perfAnalysisBtn.addEventListener('click', () => this.performPerformanceAnalysis());
        this.securityAnalysisBtn.addEventListener('click', () => this.performSecurityAnalysis());

        // Tab Navigation
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Real-time beautification
        this.codeInput.addEventListener('input', () => {
            if (this.codeInput.value) {
                this.beautifyCode();
            }
        });
    }

    /**
     * Beautify the input code
     */
    beautifyCode() {
        const code = this.codeInput.value;
        if (!code.trim()) {
            this.showNotification('Please enter some code to beautify', 'warning');
            return;
        }

        const beautified = parser.advancedFormat(code, this.currentLanguage);
        this.codeOutput.textContent = beautified;
        this.codeHighlight.textContent = beautified;
        this.updateHighlighting();
        
        this.addToHistory(code, 'beautify');
        this.showNotification('Code beautified! ✨', 'success');
    }

    /**
     * Analyze code with AI
     */
    async analyzeWithAI() {
        const code = this.codeInput.value;
        if (!code.trim()) {
            this.showNotification('Please enter code to analyze', 'warning');
            return;
        }

        this.showLoader(true);

        try {
            // Get syntax issues
            const issues = parser.analyzeCode(code, this.currentLanguage);
            this.displayIssues(issues);

            // Get AI analysis
            const analysis = await this.callAIAnalysis(code);
            this.displayAnalysis(analysis);

            this.showNotification('Analysis complete! 🔍', 'success');
        } catch (error) {
            this.showNotification('Analysis failed: ' + error.message, 'error');
        } finally {
            this.showLoader(false);
        }
    }

    /**
     * Generate script based on template and description
     */
    async generateScript() {
        const type = this.scriptType.value;
        const language = this.generatorLanguage.value;
        const description = this.scriptDescription.value;

        if (!type || !description.trim()) {
            this.showNotification('Please select a type and describe your script', 'warning');
            return;
        }

        this.showLoader(true);

        try {
            const features = this.getSelectedFeatures();
            const prompt = this.buildGenerationPrompt(type, description, language, features);
            const generatedCode = await this.callAIGeneration(prompt);

            this.generatedOutput.textContent = generatedCode;
            this.generatedHighlight.textContent = generatedCode;
            this.updateHighlighting();
            this.addToHistory(generatedCode, 'generate');
            this.showNotification('Script generated successfully! 🎉', 'success');
        } catch (error) {
            this.showNotification('Generation failed: ' + error.message, 'error');
        } finally {
            this.showLoader(false);
        }
    }

    /**
     * Perform full code analysis
     */
    async performFullAnalysis() {
        const code = this.analysisInput.value;
        if (!code.trim()) {
            this.showNotification('Please paste code to analyze', 'warning');
            return;
        }

        this.showLoader(true);

        try {
            const metrics = parser.analyzePerformance(code);
            const securityIssues = parser.analyzeSecurtiy(code);
            const syntaxIssues = parser.analyzeCode(code, 'javascript');

            this.displayResults({
                metrics,
                securityIssues,
                syntaxIssues
            });

            this.showNotification('Deep analysis complete! 📊', 'success');
        } catch (error) {
            this.showNotification('Deep analysis failed', 'error');
        } finally {
            this.showLoader(false);
        }
    }

    /**
     * Perform performance analysis
     */
    performPerformanceAnalysis() {
        const code = this.analysisInput.value;
        if (!code.trim()) {
            this.showNotification('Please paste code to analyze', 'warning');
            return;
        }

        const metrics = parser.analyzePerformance(code);
        this.displayPerformanceResults(metrics);
        this.showNotification('Performance analysis complete! ⚡', 'success');
    }

    /**
     * Perform security analysis
     */
    performSecurityAnalysis() {
        const code = this.analysisInput.value;
        if (!code.trim()) {
            this.showNotification('Please paste code to analyze', 'warning');
            return;
        }

        const issues = parser.analyzeSecurtiy(code);
        this.displaySecurityResults(issues);
        this.showNotification('Security scan complete! 🔒', 'success');
    }

    /**
     * Display analysis results
     */
    displayAnalysis(analysis) {
        this.analysisContainer.innerHTML = '';
        const items = Array.isArray(analysis) ? analysis : [analysis];
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'analysis-item';
            div.innerHTML = `
                <h3>${item.title || 'Analysis Result'}</h3>
                <p>${item.message || item}</p>
            `;
            this.analysisContainer.appendChild(div);
        });
    }

    /**
     * Display found issues
     */
    displayIssues(issues) {
        this.issuesContainer.innerHTML = '';
        
        if (issues.length === 0) {
            this.issuesContainer.innerHTML = '<div class="placeholder"><p>No issues found! ✓</p></div>';
            return;
        }

        issues.forEach(issue => {
            const div = document.createElement('div');
            div.className = `issue-item ${issue.severity || 'warning'}`;
            div.innerHTML = `
                <h3>Line ${issue.line}: ${issue.message}</h3>
                <p>Severity: ${issue.severity || 'warning'}</p>
                <div class="fix-suggestion">
                    <strong>💡 Tip:</strong> Review the code at this line for potential issues.
                </div>
            `;
            this.issuesContainer.appendChild(div);
        });
    }

    /**
     * Display full analysis results
     */
    displayResults(results) {
        this.resultsContainer.innerHTML = `
            <div class="analysis-item">
                <h3>📊 Code Metrics</h3>
                <p>Lines: ${results.metrics.lines}</p>
                <p>Functions: ${results.metrics.functions}</p>
                <p>Loops: ${results.metrics.loops}</p>
                <p>Max Nesting Level: ${results.metrics.nestedLevels}</p>
            </div>
        `;

        if (results.securityIssues.length > 0) {
            results.securityIssues.forEach(issue => {
                const div = document.createElement('div');
                div.className = 'issue-item error';
                div.innerHTML = `
                    <h3>🔒 ${issue.message}</h3>
                    <p>Found ${issue.count} occurrence(s)</p>
                `;
                this.resultsContainer.appendChild(div);
            });
        }

        if (results.metrics.recommendations.length > 0) {
            results.metrics.recommendations.forEach(rec => {
                const div = document.createElement('div');
                div.className = 'issue-item warning';
                div.innerHTML = `<h3>⚠️ ${rec}</h3>`;
                this.resultsContainer.appendChild(div);
            });
        }
    }

    /**
     * Display performance results
     */
    displayPerformanceResults(metrics) {
        this.resultsContainer.innerHTML = `
            <div class="analysis-item">
                <h3>⚡ Performance Metrics</h3>
                <p><strong>Lines of Code:</strong> ${metrics.lines}</p>
                <p><strong>Functions:</strong> ${metrics.functions}</p>
                <p><strong>Loops:</strong> ${metrics.loops}</p>
                <p><strong>Nesting Complexity:</strong> ${metrics.nestedLevels}/10</p>
                ${metrics.recommendations.map(rec => `<p class="warning">⚠️ ${rec}</p>`).join('')}
            </div>
        `;
    }

    /**
     * Display security results
     */
    displaySecurityResults(issues) {
        this.resultsContainer.innerHTML = '';
        
        if (issues.length === 0) {
            this.resultsContainer.innerHTML = '<div class="analysis-item"><h3>✓ No security issues found!</h3></div>';
            return;
        }

        issues.forEach(issue => {
            const div = document.createElement('div');
            div.className = 'issue-item error';
            div.innerHTML = `
                <h3>🔒 ${issue.message}</h3>
                <p>Occurrences: ${issue.count}</p>
            `;
            this.resultsContainer.appendChild(div);
        });
    }

    /**
     * Clear the input code
     */
    clearCode() {
        this.codeInput.value = '';
        this.codeOutput.textContent = '// Your beautified code will appear here';
        this.codeHighlight.textContent = '// Your beautified code will appear here';
        this.showNotification('Code cleared! 🗑️', 'success');
    }

    /**
     * Copy text to clipboard
     */
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard! 📋', 'success');
        }).catch(err => {
            this.showNotification('Failed to copy', 'error');
        });
    }

    /**
     * Download code as file
     */
    downloadCode() {
        const code = this.codeOutput.textContent;
        const ext = this.getFileExtension(this.currentLanguage);
        this.downloadFile(code, `code.${ext}`);
    }

    /**
     * Download generated script
     */
    downloadGeneratedScript() {
        const code = this.generatedOutput.textContent;
        const ext = this.getFileExtension(this.generatorLanguage.value);
        this.downloadFile(code, `generated.${ext}`);
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showNotification('File downloaded! ⬇️', 'success');
    }

    /**
     * Get file extension for language
     */
    getFileExtension(language) {
        const extensions = {
            javascript: 'js',
            typescript: 'ts',
            python: 'py',
            lua: 'lua',
            html: 'html',
            css: 'css',
            json: 'json',
            sql: 'sql',
            java: 'java',
            cpp: 'cpp'
        };
        return extensions[language] || 'txt';
    }

    /**
     * Get selected features from checkboxes
     */
    getSelectedFeatures() {
        const checkboxes = document.querySelectorAll('.checkbox-label input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    /**
     * Build AI generation prompt
     */
    buildGenerationPrompt(type, description, language, features) {
        return `Create a ${language} ${type} script.
Description: ${description}
Include features: ${features.join(', ') || 'basic functionality'}
Ensure: proper error handling, clear comments, best practices
Make it production-ready and well-documented.`;
    }

    /**
     * Call AI for code analysis
     */
    async callAIAnalysis(code) {
        // Simulated AI response - In production, connect to actual API
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        title: '🎯 Code Quality',
                        message: 'Your code follows good practices. Keep up the excellent work!'
                    },
                    {
                        title: '💡 Optimization Tip',
                        message: 'Consider breaking down complex functions into smaller, reusable units.'
                    },
                    {
                        title: '📚 Best Practices',
                        message: 'Use consistent naming conventions throughout your codebase.'
                    }
                ]);
            }, 1500);
        });
    }

    /**
     * Call AI for script generation
     */
    async callAIGeneration(prompt) {
        // Simulated AI response - In production, connect to Anthropic API
        const templates = {
            'web-server': this.getWebServerTemplate(),
            'rest-api': this.getRestAPITemplate(),
            'game-loop': this.getGameLoopTemplate(),
            'data-parser': this.getDataParserTemplate(),
            'automation': this.getAutomationTemplate(),
            'crypto': this.getCryptoTemplate(),
            'chatbot': this.getChatbotTemplate(),
            'ml-model': this.getMLTemplate()
        };

        const type = this.scriptType.value;
        const language = this.generatorLanguage.value;
        
        return new Promise((resolve) => {
            setTimeout(() => {
                let code = templates[type] || this.getDefaultTemplate();
                
                // Apply language conversion if needed
                if (language === 'python') {
                    code = this.convertToPython(code);
                } else if (language === 'lua') {
                    code = this.convertToLua(code);
                }

                // Apply selected features
                const features = this.getSelectedFeatures();
                if (features.includes('logging')) {
                    code = this.addLogging(code, language);
                }
                if (features.includes('error-handling')) {
                    code = this.addErrorHandling(code, language);
                }

                resolve(code);
            }, 1500);
        });
    }

    /**
     * Script templates
     */
    getWebServerTemplate() {
        return `// Web Server Template
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Welcome to CodeForge Server!</h1>');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
});`;
    }

    getRestAPITemplate() {
        return `// REST API Template
const express = require('express');
const app = express();

app.use(express.json());

// Get all items
app.get('/api/items', (req, res) => {
    res.json({ items: [] });
});

// Create new item
app.post('/api/items', (req, res) => {
    res.json({ success: true, item: req.body });
});

// Update item
app.put('/api/items/:id', (req, res) => {
    res.json({ success: true });
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
    res.json({ success: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(\`API running on port \${PORT}\`));`;
    }

    getGameLoopTemplate() {
        return `// Game Loop Template
class Game {
    constructor() {
        this.running = true;
        this.score = 0;
        this.fps = 60;
    }

    init() {
        console.log('Game initialized');
    }

    update() {
        // Update game state
    }

    render() {
        // Render game
        console.log(\`Score: \${this.score}\`);
    }

    run() {
        this.init();
        const loop = setInterval(() => {
            this.update();
            this.render();
        }, 1000 / this.fps);
    }
}

const game = new Game();
game.run();`;
    }

    getDataParserTemplate() {
        return `// Data Parser Template
class DataParser {
    parse(data) {
        if (typeof data === 'string') {
            return JSON.parse(data);
        }
        return data;
    }

    validate(data, schema) {
        // Validate against schema
        return true;
    }

    transform(data, transformer) {
        return transformer(data);
    }
}

const parser = new DataParser();
const result = parser.parse('{"key": "value"}');
console.log(result);`;
    }

    getAutomationTemplate() {
        return `// Automation Script Template
class Automation {
    constructor() {
        this.tasks = [];
    }

    addTask(name, fn) {
        this.tasks.push({ name, fn });
    }

    async run() {
        for (const task of this.tasks) {
            console.log(\`Running: \${task.name}\`);
            await task.fn();
        }
    }
}

const auto = new Automation();
auto.addTask('Task 1', async () => console.log('Task 1 complete'));
auto.addTask('Task 2', async () => console.log('Task 2 complete'));
auto.run();`;
    }

    getCryptoTemplate() {
        return `// Crypto Wallet Template
const crypto = require('crypto');

class Wallet {
    constructor() {
        this.privateKey = crypto.randomBytes(32);
        this.balance = 0;
    }

    generateAddress() {
        return this.privateKey.toString('hex').substring(0, 42);
    }

    deposit(amount) {
        this.balance += amount;
    }

    withdraw(amount) {
        if (amount <= this.balance) {
            this.balance -= amount;
            return true;
        }
        return false;
    }
}

const wallet = new Wallet();
console.log(\`Address: \${wallet.generateAddress()}\`);`;
    }

    getChatbotTemplate() {
        return `// AI Chatbot Template
class Chatbot {
    constructor() {
        this.responses = {
            'hello': 'Hi there! How can I help?',
            'how are you': 'I\\'m doing great, thanks for asking!',
            'bye': 'Goodbye! Have a great day!'
        };
    }

    respond(message) {
        const msg = message.toLowerCase();
        return this.responses[msg] || 'I don\\'t understand that.';
    }
}

const bot = new Chatbot();
console.log(bot.respond('hello'));`;
    }

    getMLTemplate() {
        return `// ML Model Template
class MLModel {
    constructor() {
        this.weights = [];
        this.bias = 0;
    }

    train(data, labels) {
        console.log('Training model...');
        // Training logic
    }

    predict(input) {
        // Prediction logic
        return 0.5;
    }

    evaluate(testData, testLabels) {
        console.log('Evaluating model...');
        return 0.95; // Accuracy
    }
}

const model = new MLModel();
model.train([], []);
console.log(\`Prediction: \${model.predict([1, 2, 3])}\`);`;
    }

    getDefaultTemplate() {
        return `// Default Template
console.log('Hello, World!');`;
    }

    /**
     * Language conversion helpers
     */
    convertToPython(code) {
        let python = code.replace(/const\s+(\w+)\s*=\s*/g, '$1 = ');
        python = python.replace(/function\s+(\w+)\s*\(/g, 'def $1(');
        python = python.replace(/console\.log\(/g, 'print(');
        python = python.replace(/require\s*\(/g, 'import ');
        python = python.replace(/\{/g, ':').replace(/\}/g, '');
        return python;
    }

    convertToLua(code) {
        let lua = code.replace(/const\s+(\w+)\s*=\s*/g, 'local $1 = ');
        lua = lua.replace(/function\s+(\w+)\s*\(/g, 'function $1(');
        lua = lua.replace(/console\.log\(/g, 'print(');
        lua = lua.replace(/require\s*\(/g, 'require(');
        lua += '\nreturn';
        return lua;
    }

    addLogging(code, language) {
        if (language === 'javascript') {
            return `// Logging enabled
const log = (msg) => console.log(\`[LOG] \${new Date().toISOString()}: \${msg}\`);

${code.replace(/console\.log\(/g, 'log(')}`;
        }
        return code;
    }

    addErrorHandling(code, language) {
        if (language === 'javascript') {
            return `try {
${code.split('\n').map(line => '    ' + line).join('\n')}
} catch (error) {
    console.error('Error:', error.message);
}`;
        }
        return code;
    }

    /**
     * Setup template cards
     */
    setupTemplateCards() {
        const cards = document.querySelectorAll('.template-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.textContent.toLowerCase();
                if (type.includes('hello')) this.scriptType.value = '';
                if (type.includes('http')) this.scriptType.value = 'web-server';
                if (type.includes('database')) this.scriptType.value = 'data-parser';
                if (type.includes('authentication')) this.scriptType.value = 'crypto';
                
                this.showNotification('Template selected! Fill in details and generate.', 'info');
            });
        });
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        this.tabContents.forEach(content => content.classList.remove('active'));
        this.tabBtns.forEach(btn => btn.classList.remove('active'));

        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    /**
     * Update syntax highlighting
     */
    updateHighlighting() {
        const code = this.codeHighlight.textContent;
        const highlighted = parser.highlightSyntax(code, this.currentLanguage);
        this.codeHighlight.innerHTML = highlighted;
    }

    /**
     * Show/hide loader
     */
    showLoader(show) {
        if (show) {
            this.loader.classList.remove('hidden');
        } else {
            this.loader.classList.add('hidden');
        }
    }

    /**
     * Show notification toast
     */
    showNotification(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    /**
     * History management
     */
    addToHistory(code, action) {
        this.history.push({
            code,
            action,
            timestamp: new Date(),
            language: this.currentLanguage
        });

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        this.saveToLocalStorage();
    }

    /**
     * Local storage helpers
     */
    saveToLocalStorage() {
        localStorage.setItem('codeforge_history', JSON.stringify(this.history));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('codeforge_history');
        if (stored) {
            try {
                this.history = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to load history');
            }
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.codeForge = new CodeForgeApp();
});
