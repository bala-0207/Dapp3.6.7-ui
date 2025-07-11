/**
 * ZK-PRET Web Application
 * Clean, modular, and maintainable zero-knowledge proof regulatory technology platform
 */

class ZKPretAsyncApp {
    constructor() {
        this.currentTab = 'compliance';
        this.isAsyncMode = true;
        this.jobs = new Map();
        this.websocket = null;
        this.syncExecuting = false;
        this.gleifComponent = null;
        this.corporateComponent = null;
        this.eximComponent = null;
        this.scfComponent = null;
        this.riskComponent = null;
        this.uploadedFiles = {
            dataFile: null,
            actualProcessFile: null,
            expectedProcessFile: null,
            deepCompositionFile: null
        };
        
        // Store handlers to prevent duplicate event listeners
        this.executionHandlers = new Map();

        // 🆕 HTTP Response tracking properties (Safe Addition)
        this.httpResponseEnabled = true; // Feature flag - set to false to disable
        this.lastHttpResponseData = null; // Store last HTTP response safely
        this.httpRespDetailedViewVisible = false; // Track detailed view state
        this.httpResponseHistory = []; // Store history of HTTP responses
        this.maxHttpResponseHistorySize = 10; // Maximum number of responses to keep in history

        // Initialize SCF enhancement if available
        if (window.scfEnhancement) {
            Object.assign(this, window.scfEnhancement);
            this.initSCF();
        }

        this.init();
        
        // Debug log
        console.log('🎯 ZK-PRET App constructor completed', {
            currentTab: this.currentTab,
            isAsyncMode: this.isAsyncMode,
            components: {
                gleif: !!this.gleifComponent,
                corporate: !!this.corporateComponent,
                exim: !!this.eximComponent,
                scf: !!this.scfComponent,
                risk: !!this.riskComponent
            }
        });
    }

    async init() {
        console.log('🚀 Initializing ZK-PRET Application...');
        
        this.checkSpecialTabMode();
        this.setupEventListeners();
        this.setupFileDropZones();
        this.initWebSocket();
        await this.checkConnection();
        this.updateModeDisplay();
        
        // Initialize default file picker for SCF process type
        setTimeout(() => {
            const processTypeSelect = document.getElementById('process-type-select');
            if (processTypeSelect && processTypeSelect.value === 'SCF') {
                this.populateProcessFileDropdowns('SCF');
            }
            
            // Initialize bill of lading files for data integrity
            this.populateBillOfLadingFiles();
            
            // Debug: Check if components are available
            console.log('🔍 Available components:', {
                RiskComponent: typeof window.RiskComponent,
                GLEIFComponent: typeof window.GLEIFComponent,
                CorporateComponent: typeof window.CorporateComponent,
                SCFComponent: typeof window.SCFComponent
            });
            
            // Force initialization of Risk component if in risk mode
            if (this.currentTab === 'risk' && !this.riskComponent) {
                this.forceInitializeRiskComponent();
            }
        }, 500);
        
        console.log('✅ ZK-PRET Application initialized successfully');
        
        // DIAGNOSTIC: Track how many times init() is called
        window.zkAppInitCount = (window.zkAppInitCount || 0) + 1;
        console.log(`📊 ZK-PRET App init count: ${window.zkAppInitCount}`);
        if (window.zkAppInitCount > 1) {
            console.warn(`⚠️ Multiple app initializations detected! Count: ${window.zkAppInitCount}`);
            console.trace('Init call trace:');
        }
    }

    // =============================
    // FILE PICKER FUNCTIONALITY
    // =============================
    
    async populateBillOfLadingFiles() {
        try {
            console.log('🔄 Loading bill of lading files...');
            
            const response = await fetch('/api/v1/bill-of-lading-files');
            if (response.ok) {
                const data = await response.json();
                
                const fileSelect = document.getElementById('data-file-select');
                if (fileSelect) {
                    fileSelect.innerHTML = '<option value="">Select bill of lading file...</option>';
                    data.files.forEach(file => {
                        const option = document.createElement('option');
                        option.value = file;
                        option.textContent = file;
                        fileSelect.appendChild(option);
                    });
                    console.log(`✅ Loaded ${data.files.length} bill of lading files`);
                }
            } else {
                console.log('⚠️ Failed to load bill of lading files:', await response.text());
                this.showNotification('File Loading Error', 'Failed to load bill of lading files', 'error');
            }
        } catch (error) {
            console.error('Failed to load bill of lading files:', error);
            this.showNotification('File Loading Error', 'Failed to load bill of lading files', 'error');
        }
    }
    
    async populateProcessFileDropdowns(processType) {
        if (!processType) {
            // Clear dropdowns if no process type selected
            const expectedSelect = document.getElementById('expected-process-file-select');
            const actualSelect = document.getElementById('actual-process-file-select');
            
            if (expectedSelect) {
                expectedSelect.innerHTML = '<option value="">Select expected process file...</option>';
            }
            if (actualSelect) {
                actualSelect.innerHTML = '<option value="">Select actual process file...</option>';
            }
            return;
        }
        
        try {
            console.log(`🔄 Loading process files for ${processType}...`);
            
            // Populate Expected files
            const expectedResponse = await fetch(`/api/v1/process-files/${processType}/expected`);
            if (expectedResponse.ok) {
                const expectedData = await expectedResponse.json();
                
                const expectedSelect = document.getElementById('expected-process-file-select');
                if (expectedSelect) {
                    expectedSelect.innerHTML = '<option value="">Select expected process file...</option>';
                    expectedData.files.forEach(file => {
                        const option = document.createElement('option');
                        option.value = file;
                        option.textContent = file;
                        // Auto-select files that contain 'Expected' or 'expected'
                        if (file.toLowerCase().includes('expected')) {
                            option.selected = true;
                        }
                        expectedSelect.appendChild(option);
                    });
                    console.log(`✅ Loaded ${expectedData.files.length} expected files for ${processType}`);
                }
            } else {
                console.log(`⚠️ Failed to load expected files for ${processType}:`, await expectedResponse.text());
            }
            
            // Populate Actual files
            const actualResponse = await fetch(`/api/v1/process-files/${processType}/actual`);
            if (actualResponse.ok) {
                const actualData = await actualResponse.json();
                
                const actualSelect = document.getElementById('actual-process-file-select');
                if (actualSelect) {
                    actualSelect.innerHTML = '<option value="">Select actual process file...</option>';
                    actualData.files.forEach(file => {
                        const option = document.createElement('option');
                        option.value = file;
                        option.textContent = file;
                        actualSelect.appendChild(option);
                    });
                    console.log(`✅ Loaded ${actualData.files.length} actual files for ${processType}`);
                }
            } else {
                console.log(`⚠️ Failed to load actual files for ${processType}:`, await actualResponse.text());
            }
            
        } catch (error) {
            console.error('Failed to load process files:', error);
            this.showNotification('File Loading Error', `Failed to load ${processType} process files`, 'error');
        }
    }

    // =============================
    // SPECIAL TAB MODE HANDLING
    // =============================
    
    checkSpecialTabMode() {
        const targetTab = sessionStorage.getItem('zkpret_target_tab');
        if (targetTab === 'process-integrity') {
            this.showProcessIntegrityOnly();
        } else if (targetTab === 'data-integrity') {
            this.showDataIntegrityOnly();
        } else if (targetTab === 'risk') {
            this.showRiskOnly();
        } else if (targetTab === 'registry') {
            this.showRegistryOnly();
        } else if (targetTab === 'scf') {
            this.showSCFOnly();
        } else if (targetTab === 'deep-composition') {
            this.showDeepCompositionOnly();
        }
    }

    showProcessIntegrityOnly() {
        this.showSpecialMode('process-integrity', 'Business Process Integrity Prover | ZK-PRET');
    }

    showDataIntegrityOnly() {
        this.showSpecialMode('data-integrity', 'Business Data Integrity Prover | ZK-PRET');
    }

    showRiskOnly() {
        console.log('🎯 showRiskOnly() called - Starting Risk special mode');
        this.showSpecialMode('risk', 'Risk & Liquidity Prover | ZK-PRET');
        
        // Initialize Risk Component for special mode
        setTimeout(async () => {
            console.log('⏰ Risk initialization timeout triggered');
            console.log('🔍 Current riskComponent state:', !!this.riskComponent);
            console.log('🔍 RiskComponent availability:', !!window.RiskComponent);
            
            if (!this.riskComponent && window.RiskComponent) {
                try {
                    console.log('🏗️ Initializing Risk Component for special mode...');
                    this.riskComponent = new window.RiskComponent();
                    console.log('✅ Risk Component created successfully');
                } catch (error) {
                    console.error('❌ Failed to initialize Risk Component for special mode:', error);
                    console.error('❌ Error stack:', error.stack);
                }
            } else if (!window.RiskComponent) {
                console.error('❌ RiskComponent class not available');
            } else {
                console.log('ℹ️ Risk component already exists, skipping initialization');
            }
        }, 200);
    }

    showRegistryOnly() {
        this.showSpecialMode('registry', 'Registry | ZK-PRET');
    }

    showSCFOnly() {
        console.log('🎯 showSCFOnly() called - Starting SCF special mode');
        this.showSpecialMode('scf', 'Supply Chain Finance Verification | ZK-PRET');
        
        // Initialize SCF Container Widget for special mode
        setTimeout(async () => {
            console.log('⏰ SCF initialization timeout triggered');
            console.log('🔍 Current scfComponent state:', !!this.scfComponent);
            console.log('🔍 SCFContainerWidget availability:', !!window.SCFContainerWidget);
            
            if (!this.scfComponent && window.SCFContainerWidget) {
                try {
                    console.log('🏗️ Initializing SCF Container Widget for special mode...');
                    this.scfComponent = new window.SCFContainerWidget();
                    console.log('✅ SCF Container Widget created successfully');
                    
                    await this.scfComponent.init();
                    console.log('✅ SCF Container Widget init() completed');
                    
                    // Replace the loading content with the SCF container
                    const containerContent = document.getElementById('scf-container-content');
                    console.log('🔍 SCF container content element:', !!containerContent);
                    
                    if (containerContent) {
                        containerContent.innerHTML = '';
                        console.log('🧹 Cleared loading content');
                        
                        this.scfComponent.render();
                        console.log('🎨 SCF Container Widget render() completed');
                        
                        // Check if the SCF container was rendered properly
                        const scfTab = document.getElementById('scf-tab');
                        console.log('🔍 SCF tab element:', !!scfTab);
                        
                        if (scfTab && scfTab.querySelector('.scf-container')) {
                            console.log('📦 Moving SCF container content');
                            containerContent.appendChild(scfTab.querySelector('.scf-container'));
                            console.log('✅ SCF container content moved successfully');
                        } else {
                            console.warn('⚠️ SCF container element not found in scf-tab');
                        }
                    } else {
                        console.error('❌ SCF container content element not found');
                    }
                    
                    console.log('✅ SCF Container Widget initialized for special mode');
                } catch (error) {
                    console.error('❌ Failed to initialize SCF Container Widget for special mode:', error);
                    console.error('❌ Error stack:', error.stack);
                }
            } else if (!window.SCFContainerWidget) {
                console.error('❌ SCFContainerWidget class not available');
            } else {
                console.log('ℹ️ SCF component already exists, skipping initialization');
            }
        }, 200);
    }

    showDeepCompositionOnly() {
        this.showSpecialMode('deep-composition', 'DeepComposition Analysis | ZK-PRET');
    }

    showSpecialMode(mode, title) {
        console.log(`🚀 showSpecialMode() called for mode: ${mode}`);
        
        const mainNav = document.querySelector('#tab-navigation nav:first-child');
        const specialNav = document.getElementById(`${mode}-only-nav`);
        
        console.log('🔍 Main nav element:', !!mainNav);
        console.log('🔍 Special nav element:', !!specialNav);
        
        if (mainNav) {
            mainNav.classList.add('hidden');
            console.log('✅ Main navigation hidden');
        }
        if (specialNav) {
            specialNav.classList.remove('hidden');
            console.log('✅ Special navigation shown');
        }
        
        // Hide all tabs except the target
        const allTabContents = document.querySelectorAll('.tab-content');
        console.log(`🔍 Found ${allTabContents.length} tab content elements`);
        
        allTabContents.forEach(content => {
            if (content.id !== `${mode}-tab`) {
                content.style.display = 'none';
                content.classList.add('hidden');
                content.classList.remove('active');
                console.log(`📦 Hidden tab: ${content.id}`);
            } else {
                // Show the target tab properly
                content.style.display = 'block';
                content.classList.remove('hidden');
                content.classList.add('active');
                console.log(`✅ Activated tab: ${content.id}`);
            }
        });
        
        this.currentTab = mode;
        document.title = title;
        sessionStorage.removeItem('zkpret_target_tab');
        
        console.log(`✅ Current tab set to: ${mode}`);
        console.log(`📝 Document title set to: ${title}`);
        
        // FIX: Re-initialize form elements after DOM changes
        setTimeout(() => {
            console.log(`🔄 Re-initializing form elements for special mode: ${mode}`);
            this.setupFileDropZones();
            this.setupExecutionButtons();
            
            // Initialize file picker for process integrity if it's the target
            if (mode === 'process-integrity') {
                const processTypeSelect = document.getElementById('process-type-select');
                if (processTypeSelect && processTypeSelect.value) {
                    this.populateProcessFileDropdowns(processTypeSelect.value);
                }
            }
            
            // Initialize bill of lading files for data integrity if it's the target
            if (mode === 'data-integrity') {
                this.populateBillOfLadingFiles();
            }
            
            // Initialize RiskComponent for risk mode
            if (mode === 'risk' && !this.riskComponent) {
                if (window.RiskComponent) {
                    try {
                        console.log('🔧 Initializing RiskComponent for special mode');
                        this.riskComponent = new window.RiskComponent();
                        console.log('✅ RiskComponent initialized successfully');
                    } catch (error) {
                        console.error('❌ Failed to initialize Risk component:', error);
                    }
                } else {
                    console.error('❌ RiskComponent class not found');
                }
            }
            
            // Log debug info to verify form elements are present
            console.log('🔧 Special mode initialized:', {
                mode,
                targetTab: document.getElementById(`${mode}-tab`),
                processTypeSelect: document.getElementById('process-type-select'),
                expectedProcessSelect: document.getElementById('expected-process-file-select'),
                actualProcessSelect: document.getElementById('actual-process-file-select'),
                executeButton: document.getElementById('process-integrity-execute-btn'),
                riskContent: document.getElementById('risk-content'),
                riskComponent: !!this.riskComponent
            });
        }, 100);
    }

    // =============================
    // EVENT LISTENERS SETUP
    // =============================
    
    setupEventListeners() {
        console.log('🔍 setupEventListeners() called');
        this.setupTabNavigation();
        this.setupModeToggle();
        this.setupDataInputMethods();
        this.setupExecutionButtons();
        this.setupUtilityButtons();
    }

    setupTabNavigation() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab || e.target.closest('.tab-btn').dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    setupModeToggle() {
        const modeToggle = document.getElementById('async-mode-toggle');
        if (modeToggle) {
            modeToggle.addEventListener('change', (e) => {
                this.isAsyncMode = e.target.checked;
                this.updateModeDisplay();
                this.showNotification(
                    this.isAsyncMode ? 'Async Mode Enabled' : 'Sync Mode Enabled',
                    this.isAsyncMode ? 'Jobs will run in background' : 'Jobs will block UI until complete',
                    'info'
                );
            });
        }
    }

    setupDataInputMethods() {
        // No longer needed since we use dropdown selection
        // Keeping this method for backward compatibility
    }

    setupExecutionButtons() {
        console.log('🔧 setupExecutionButtons() called - checking for duplicate registrations');
        
        const executionButtons = [
            { id: 'gleif-execute-btn', handler: () => this.executeGLEIF() },
            { id: 'corporate-execute-btn', handler: () => this.executeCorporateRegistration() },
            { id: 'exim-execute-btn', handler: () => this.executeEXIM() },
            { id: 'data-integrity-execute-btn', handler: () => this.executeBusinessDataIntegrity() },
            { id: 'process-integrity-execute-btn', handler: () => this.executeBusinessProcessIntegrity() },
            // Risk execution is now handled by RiskComponent internally
            { id: 'scf-execute-btn', handler: () => this.executeSCF() },
            { id: 'deep-composition-execute-btn', handler: () => this.executeDeepComposition() },
            { id: 'registry-execute-btn', handler: () => this.executeRegistry() },
            { id: 'composed-proof-execute-btn', handler: () => this.executeComposedProof() }
        ];

        executionButtons.forEach(({ id, handler }) => {
            const btn = document.getElementById(id);
            if (btn) {
                // DIAGNOSTIC: Check if button already has event listeners
                const existingListeners = btn.getAttribute('data-listeners-count') || '0';
                const newCount = parseInt(existingListeners) + 1;
                
                console.log(`📊 Button ${id}:`, {
                    existingListeners: existingListeners,
                    newCount: newCount,
                    element: btn
                });
                
                if (newCount > 1) {
                    console.warn(`⚠️ DUPLICATE LISTENER DETECTED for ${id}! Count: ${newCount}`);
                }
                
                // Track listener count
                btn.setAttribute('data-listeners-count', newCount.toString());
                
                // Remove any existing event listeners to prevent duplicates
                const existingHandler = this.executionHandlers.get(id);
                if (existingHandler) {
                    btn.removeEventListener('click', existingHandler);
                    console.log(`🧹 Removed existing handler for ${id}`);
                }
                
                // Store and add new handler
                this.executionHandlers.set(id, handler);
                btn.addEventListener('click', handler);
                
                console.log(`✅ Added event listener for ${id}`);
            } else {
                console.warn(`❌ Button not found: ${id}`);
            }
        });
        
        // Add process type change handler for file picker
        const processTypeSelect = document.getElementById('process-type-select');
        if (processTypeSelect) {
            processTypeSelect.addEventListener('change', (e) => {
                const processType = e.target.value;
                console.log(`🔄 Process type changed to: ${processType}`);
                this.populateProcessFileDropdowns(processType);
            });
        }
    }

    setupUtilityButtons() {
        // Enhanced mode toggle for GLEIF
        const gleifEnhancedMode = document.getElementById('gleif-enhanced-mode');
        if (gleifEnhancedMode) {
            gleifEnhancedMode.addEventListener('change', (e) => {
                this.toggleGLEIFMode(e.target.checked);
            });
        }

        // Clear completed jobs
        const clearJobsBtn = document.getElementById('clear-completed-jobs');
        if (clearJobsBtn) {
            clearJobsBtn.addEventListener('click', () => this.clearCompletedJobs());
        }
    }

    // =============================
    // FILE MANAGEMENT
    // =============================
    
    setupFileDropZones() {
        const dropZoneConfigs = [
            { zone: 'data-file-drop-zone', input: 'data-file-input', key: 'dataFile' },
            { zone: 'actual-process-drop-zone', input: 'actual-process-input', key: 'actualProcessFile' },
            { zone: 'expected-process-drop-zone', input: 'expected-process-input', key: 'expectedProcessFile' },
            { zone: 'deep-composition-file-drop-zone', input: 'deep-composition-file-input', key: 'deepCompositionFile' }
        ];

        dropZoneConfigs.forEach(config => {
            this.setupDropZone(config.zone, config.input, config.key);
        });
    }

    setupDropZone(dropZoneId, inputId, fileKey) {
        const dropZone = document.getElementById(dropZoneId);
        const fileInput = document.getElementById(inputId);
        
        if (!dropZone || !fileInput) return;

        // Click to browse
        dropZone.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0], fileKey, dropZoneId);
            }
        });

        // Drag and drop events
        ['dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                
                if (eventName === 'dragover') {
                    dropZone.classList.add('dragover');
                } else if (eventName === 'dragleave') {
                    dropZone.classList.remove('dragover');
                } else if (eventName === 'drop') {
                    dropZone.classList.remove('dragover');
                    if (e.dataTransfer.files.length > 0) {
                        this.handleFile(e.dataTransfer.files[0], fileKey, dropZoneId);
                    }
                }
            });
        });
    }

    handleFile(file, fileKey, dropZoneId) {
        this.uploadedFiles[fileKey] = file;
        this.updateFileDisplay(file, dropZoneId);
    }

    updateFileDisplay(file, dropZoneId) {
        const dropZone = document.getElementById(dropZoneId);
        if (!dropZone) return;

        const placeholder = dropZone.querySelector('.file-placeholder');
        const fileInfo = dropZone.querySelector('.file-info');
        
        if (placeholder) placeholder.style.display = 'none';
        if (fileInfo) {
            fileInfo.classList.add('show');
            const nameElement = fileInfo.querySelector('[id$="-file-name"]');
            const sizeElement = fileInfo.querySelector('[id$="-file-size"]');
            
            if (nameElement) nameElement.textContent = file.name;
            if (sizeElement) sizeElement.textContent = this.formatFileSize(file.size);
        }
        
        dropZone.classList.add('has-file');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // File clearing methods
    clearDataFile() { this.clearFile('dataFile', 'data-file-drop-zone', 'data-file-input'); }
    clearActualProcessFile() { this.clearFile('actualProcessFile', 'actual-process-drop-zone', 'actual-process-input'); }
    clearExpectedProcessFile() { this.clearFile('expectedProcessFile', 'expected-process-drop-zone', 'expected-process-input'); }
    clearDeepCompositionFile() { this.clearFile('deepCompositionFile', 'deep-composition-file-drop-zone', 'deep-composition-file-input'); }

    clearFile(fileKey, dropZoneId, inputId) {
        this.uploadedFiles[fileKey] = null;
        
        const dropZone = document.getElementById(dropZoneId);
        const fileInput = document.getElementById(inputId);
        
        if (dropZone) {
            const placeholder = dropZone.querySelector('.file-placeholder');
            const fileInfo = dropZone.querySelector('.file-info');
            
            if (placeholder) placeholder.style.display = 'flex';
            if (fileInfo) fileInfo.classList.remove('show');
            dropZone.classList.remove('has-file');
        }
        
        if (fileInput) fileInput.value = '';
    }

    // =============================
    // TAB MANAGEMENT
    // =============================
    
    switchTab(tabName) {
        console.log(`🔄 Switching to tab: ${tabName}`);
        
        // Prevent tab switching during sync execution
        if (!this.isAsyncMode && this.syncExecuting) {
            this.showNotification(
                'Execution in Progress',
                'Please wait for current execution to complete or switch to Async mode',
                'warning'
            );
            return;
        }

        // Check if in specialized mode
        const specialNavs = ['process-integrity-only-nav', 'data-integrity-only-nav', 'risk-only-nav', 'registry-only-nav', 'scf-only-nav', 'deep-composition-only-nav'];
        const inSpecialMode = specialNavs.some(navId => {
            const nav = document.getElementById(navId);
            return nav && !nav.classList.contains('hidden');
        });

        if (inSpecialMode) {
            console.log('⚠️ In special mode, tab switching disabled');
            return; // Don't allow tab switching in special mode
        }

        this.updateTabUI(tabName);
        this.currentTab = tabName;
        
        console.log(`✅ Tab switched to: ${tabName}`);

        // Initialize components when switching to specific tabs
        this.initializeTabComponent(tabName);
    }
    
    initializeTabComponent(tabName) {
        // Initialize bill of lading files when switching to data integrity tab
        if (tabName === 'data-integrity') {
            setTimeout(() => {
                this.populateBillOfLadingFiles();
            }, 100);
        }
        
        // Initialize GLEIF component when switching to GLEIF tab
        if (tabName === 'gleif' && !this.gleifComponent) {
            if (window.GLEIFComponent) {
                try {
                    this.gleifComponent = new window.GLEIFComponent();
                } catch (error) {
                    console.error('Failed to initialize GLEIF component:', error);
                }
            }
        }
        
        // Initialize Corporate component if needed
        if (tabName === 'corporate' && !this.corporateComponent) {
            if (window.CorporateComponent) {
                try {
                    this.corporateComponent = new window.CorporateComponent();
                } catch (error) {
                    console.error('Failed to initialize Corporate component:', error);
                }
            }
        }
        
        // Initialize EXIM component if needed
        if (tabName === 'exim' && !this.eximComponent) {
            if (window.EximComponent) {
                try {
                    this.eximComponent = new window.EximComponent();
                } catch (error) {
                    console.error('Failed to initialize EXIM component:', error);
                }
            }
        }
        
        // Initialize SCF container if needed
        if (tabName === 'scf' && !this.scfComponent) {
            if (window.SCFContainerWidget) {
                (async () => {
                    try {
                        console.log('🏗️ Initializing SCF Container Widget...');
                        this.scfComponent = new window.SCFContainerWidget();
                        await this.scfComponent.init();
                        
                        // Replace the loading content with the SCF container
                        const containerContent = document.getElementById('scf-container-content');
                        if (containerContent) {
                            containerContent.innerHTML = '';
                            this.scfComponent.render();
                            // Move the rendered content from scf-tab to the container
                            const scfTab = document.getElementById('scf-tab');
                            if (scfTab && scfTab.querySelector('.scf-container')) {
                                containerContent.appendChild(scfTab.querySelector('.scf-container'));
                            }
                        }
                        
                        console.log('✅ SCF Container Widget initialized successfully');
                    } catch (error) {
                        console.error('❌ Failed to initialize SCF Container Widget:', error);
                        // Show error in the container
                        const containerContent = document.getElementById('scf-container-content');
                        if (containerContent) {
                            containerContent.innerHTML = `
                                <div class="text-center py-8 text-red-600">
                                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                                    <p class="font-semibold">Failed to Load SCF Container</p>
                                    <p class="text-sm text-gray-600 mt-2">${error.message}</p>
                                </div>
                            `;
                        }
                    }
                })();
            } else {
                console.error('❌ SCFContainerWidget not available');
                // Fallback to basic SCF component
                if (window.SCFComponent) {
                    try {
                        this.scfComponent = new window.SCFComponent();
                    } catch (error) {
                        console.error('Failed to initialize fallback SCF component:', error);
                    }
                }
            }
        }
        
        // Initialize Risk component if needed
        if (tabName === 'risk' && !this.riskComponent) {
            if (window.RiskComponent) {
                try {
                    console.log('🔧 Initializing RiskComponent for normal tab switch');
                    this.riskComponent = new window.RiskComponent();
                    console.log('✅ RiskComponent initialized successfully');
                    
                    // The Risk component now renders its own tab structure
                    // It will default to Basel III tab as specified
                } catch (error) {
                    console.error('❌ Failed to initialize Risk component:', error);
                }
            } else {
                console.error('❌ RiskComponent class not found during tab switch');
            }
        }
    }
    
    forceInitializeRiskComponent() {
        console.log('🔧 Force initializing RiskComponent...');
        
        if (window.RiskComponent) {
            try {
                console.log('✅ RiskComponent class found, creating instance...');
                this.riskComponent = new window.RiskComponent();
                console.log('✅ RiskComponent force initialization successful');
                console.log('🎯 RiskComponent will default to Basel III Compliance tab');
            } catch (error) {
                console.error('❌ RiskComponent force initialization failed:', error);
                console.error('Error details:', error.stack);
            }
        } else {
            console.error('❌ RiskComponent class not available for force initialization');
            console.log('🔍 Checking window object:', Object.keys(window).filter(key => key.includes('Risk')));
            
            // Try again after a short delay
            setTimeout(() => {
                console.log('🔄 Retrying RiskComponent initialization...');
                if (window.RiskComponent) {
                    try {
                        this.riskComponent = new window.RiskComponent();
                        console.log('✅ RiskComponent retry initialization successful');
                        console.log('🎯 RiskComponent will default to Basel III Compliance tab');
                    } catch (error) {
                        console.error('❌ RiskComponent retry failed:', error);
                    }
                } else {
                    console.error('❌ RiskComponent still not available after retry');
                }
            }, 1000);
        }
    }

    updateTabUI(tabName) {
        console.log(`📝 Updating UI for tab: ${tabName}`);
        
        // Update sub-tab buttons (remove active from all sub-tabs first)
        document.querySelectorAll('.tab-btn.sub-tab').forEach(btn => btn.classList.remove('active'));
        
        // Check if this is a compliance-related tab
        const complianceTabs = ['compliance', 'corporate', 'exim', 'gleif', 'composed-proofs'];
        const isComplianceTab = complianceTabs.includes(tabName);
        
        if (isComplianceTab) {
            // Keep the super-tab (Compliance Prover) active
            const superTab = document.querySelector('.tab-btn.super-tab');
            if (superTab) {
                superTab.classList.add('active');
            }
            
            // If it's a specific sub-tab, activate it
            if (tabName !== 'compliance') {
                const targetBtn = document.querySelector(`[data-tab="${tabName}"].sub-tab`);
                if (targetBtn) {
                    targetBtn.classList.add('active');
                    console.log(`✅ Sub-tab button for ${tabName} activated`);
                } else {
                    console.log(`⚠️ Sub-tab button for ${tabName} not found`);
                }
            }
        } else {
            // For non-compliance tabs (including SCF), remove active from super-tab
            const superTab = document.querySelector('.tab-btn.super-tab');
            if (superTab) {
                superTab.classList.remove('active');
            }
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
            targetTab.classList.add('active');
            console.log(`✅ Tab content for ${tabName} shown`);
        } else {
            console.log(`⚠️ Tab content for ${tabName} not found`);
        }
    }

    toggleDataInputMethod(method) {
        // Method kept for backward compatibility but no longer used
        // since we now use dropdown selection for bill of lading files
    }

    toggleGLEIFMode(enhanced) {
        const originalForm = document.getElementById('gleif-original-form');
        const enhancedForm = document.getElementById('gleif-enhanced-form');
        
        if (!originalForm || !enhancedForm) return;

        if (enhanced) {
            originalForm.classList.add('hidden');
            enhancedForm.classList.remove('hidden');
            
            if (!this.gleifComponent) {
                try {
                    this.gleifComponent = new GLEIFComponent();
                } catch (error) {
                    console.error('Failed to initialize GLEIFComponent:', error);
                    this.showNotification('Enhancement Error', 'Failed to load enhanced mode', 'error');
                    document.getElementById('gleif-enhanced-mode').checked = false;
                    this.toggleGLEIFMode(false);
                }
            }
        } else {
            originalForm.classList.remove('hidden');
            enhancedForm.classList.add('hidden');
        }
    }

    // =============================
    // EXECUTION METHODS
    // =============================
    
    async executeGLEIF() {
        const companyName = document.getElementById('company-name-input')?.value?.trim();
        const lei = document.getElementById('gleif-lei-input')?.value?.trim();
        const jurisdiction = document.getElementById('gleif-jurisdiction-select')?.value;
        
        if (!companyName) {
            this.showNotification('Missing Information', 'Please enter the Legal Entity Name', 'error');
            return;
        }

        const parameters = {
            companyName: companyName,
            typeOfNet: 'TESTNET'
        };
        
        // Add optional parameters if provided
        if (lei) parameters.entityId = lei;
        if (jurisdiction) parameters.jurisdiction = jurisdiction;

        await this.executeTool('get-GLEIF-verification-with-sign', parameters);
    }

    async executeCorporateRegistration() {
        const companyName = document.getElementById('corporate-company-name-input')?.value?.trim();
        const cin = document.getElementById('cin-input')?.value?.trim();
        const registrationNumber = document.getElementById('corporate-registration-number-input')?.value?.trim();
        const jurisdiction = document.getElementById('corporate-jurisdiction-select')?.value;
        
        if (!companyName) {
            this.showNotification('Missing Information', 'Please enter the Company Name', 'error');
            return;
        }

        const parameters = {
            companyName: companyName,
            typeOfNet: 'TESTNET'
        };
        
        // Add optional parameters if provided
        if (cin) parameters.cin = cin;
        if (registrationNumber) parameters.registrationNumber = registrationNumber;
        if (jurisdiction) parameters.jurisdiction = jurisdiction;

        await this.executeTool('get-Corporate-Registration-verification-with-sign', parameters);
    }

    async executeEXIM() {
        const companyName = document.getElementById('exim-company-name-input')?.value?.trim();
        const licenseNumber = document.getElementById('exim-license-input')?.value?.trim();
        const tradeType = document.getElementById('exim-trade-type-select')?.value;
        const country = document.getElementById('exim-country-select')?.value;
        
        if (!companyName) {
            this.showNotification('Missing Information', 'Please enter the Company Name for EXIM verification', 'error');
            return;
        }

        const parameters = {
            companyName: companyName,
            typeOfNet: 'TESTNET'
        };
        
        // Add optional parameters if provided
        if (licenseNumber) parameters.licenseNumber = licenseNumber;
        if (tradeType) parameters.tradeType = tradeType;
        if (country) parameters.country = country;

        await this.executeTool('get-EXIM-verification-with-sign', parameters);
    }

    async executeBusinessDataIntegrity() {
        const timestamp = new Date().toISOString();
        const callStack = new Error().stack;
        console.log(`📝 executeBusinessDataIntegrity() called at ${timestamp}`);
        console.log('🔍 Call stack:', callStack);
        
        // Prevent double execution
        const executeBtn = document.getElementById('data-integrity-execute-btn');
        if (executeBtn && executeBtn.disabled) {
            console.log('⚠️ Already executing, ignoring duplicate request');
            return;
        }
        
        if (this.syncExecuting && !this.isAsyncMode) {
            console.log('⚠️ Already executing in sync mode, ignoring duplicate request');
            return;
        }

        const dataType = document.getElementById('data-type-select')?.value;
        const selectedFile = document.getElementById('data-file-select')?.value;

        if (!selectedFile) {
            this.showNotification('Missing File', 'Please select a bill of lading file', 'error');
            return;
        }

        // Disable button to prevent double execution
        if (executeBtn) {
            executeBtn.disabled = true;
            executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        }

        try {
            // Construct the file path for the command pattern
            // The pattern should be: node ./build/tests/with-sign/BusinessStandardDataIntegrityVerificationTest.js ./src/data/scf/BILLOFLADING/actualBL1-VALID.json
            const relativeFilePath = `./src/data/SCF/BILLOFLADING/${selectedFile}`;
            
            const parameters = { 
                command: 'node ./build/tests/with-sign/BusinessStandardDataIntegrityVerificationTest.js',
                dataType: dataType,
                filePath: relativeFilePath,
                typeOfNet: 'TESTNET'
            };
            
            await this.executeTool('get-BSDI-compliance-verification', parameters);
        } catch (error) {
            console.error('Business Data Integrity execution error:', error);
            this.showNotification('Execution Error', 'Failed to execute Business Data Integrity verification', 'error');
        } finally {
            // Re-enable button
            if (executeBtn) {
                executeBtn.disabled = false;
                executeBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Generate Business Integrity Data Proof';
            }
        }
    }

    async executeBusinessProcessIntegrity() {
        // Prevent double execution
        const executeBtn = document.getElementById('process-integrity-execute-btn');
        if (executeBtn && executeBtn.disabled) {
            console.log('⚠️ Already executing, ignoring duplicate request');
            return;
        }
        
        if (this.syncExecuting && !this.isAsyncMode) {
            console.log('⚠️ Already executing in sync mode, ignoring duplicate request');
            return;
        }

        // Get selected files from dropdowns instead of uploaded files
        const expectedFileName = document.getElementById('expected-process-file-select')?.value;
        const actualFileName = document.getElementById('actual-process-file-select')?.value;

        if (!expectedFileName || !actualFileName) {
            this.showNotification('Missing Files', 'Please select both expected and actual process files from the dropdowns', 'error');
            return;
        }

        const processType = document.getElementById('process-type-select')?.value;
        
        // Validate process type parameter
        if (!processType || !['SCF', 'DVP', 'STABLECOIN'].includes(processType)) {
            this.showNotification('Invalid Process Type', 'Please select a valid business process type', 'error');
            return;
        }

        // Disable button to prevent double execution
        if (executeBtn) {
            executeBtn.disabled = true;
            executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        }

        try {
            // Map the dropdown values to the command parameters
            let processParam;
            switch(processType) {
                case 'SCF':
                    processParam = 'SCF';
                    break;
                case 'DVP':
                    processParam = 'DVP';
                    break;
                case 'STABLECOIN':
                    processParam = 'STABLECOIN';
                    break;
                default:
                    this.showNotification('Invalid Process Type', 'Unsupported process type selected', 'error');
                    return;
            }

            // Prepare the parameters for the business process integrity verification
            const parameters = {
                command: 'node ./build/tests/with-sign/BusinessProcessIntegrityVerificationFileTestWithSign.js',
                processType: processParam,
                expectedProcessFile: expectedFileName,  // Just the filename from dropdown
                actualProcessFile: actualFileName,      // Just the filename from dropdown
                typeOfNet: 'TESTNET'
            };

            // Execute the business process integrity verification
            await this.executeTool('get-BPI-compliance-verification', parameters);
        } catch (error) {
            console.error('Business Process Integrity execution error:', error);
            this.showNotification('Execution Error', 'Failed to execute Business Process Integrity verification', 'error');
        } finally {
            // Re-enable button
            if (executeBtn) {
                executeBtn.disabled = false;
                executeBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Generate Business Process Integrity ZK Proof';
            }
        }
    }

    // Risk execution is now handled by RiskComponent internally
    // Provide methods for RiskComponent integration
    async executeRiskVerificationTool(toolName, parameters) {
        return await this.executeTool(toolName, parameters);
    }
    
    displayExecutionResult(result) {
        if (result.success) {
            this.displayResult(result);
        } else {
            this.displayError(result.error || 'Execution failed');
        }
    }

    async executeSCF() {
        const companyName = document.getElementById('scf-company-name-input')?.value?.trim();
        const supplierName = document.getElementById('scf-supplier-name-input')?.value?.trim();
        const invoiceAmount = document.getElementById('scf-invoice-amount-input')?.value?.trim();
        const financingType = document.getElementById('scf-financing-type-select')?.value;

        // Validate required fields
        if (!companyName || !supplierName || !invoiceAmount) {
            this.showNotification('Missing Information', 'Please fill in all required fields', 'error');
            return;
        }

        const amount = parseFloat(invoiceAmount);
        if (isNaN(amount) || amount <= 0) {
            this.showNotification('Invalid Amount', 'Please enter a valid invoice amount', 'error');
            return;
        }

        if (amount > 10000000 || amount < 1000) {
            this.showNotification('Amount Out of Range', 'Invoice amount must be between $1,000 and $10,000,000', 'error');
            return;
        }

        const parameters = {
            companyName: companyName,
            supplierName: supplierName,
            invoiceAmount: amount,
            financingType: financingType,
            typeOfNet: 'TESTNET'
        };

        await this.executeTool('get-SCF-verification-with-sign', parameters);
    }

    async executeDeepComposition() {
        if (!this.uploadedFiles.deepCompositionFile) {
            this.showNotification('Missing File', 'Please upload an analysis file for DeepComposition', 'error');
            return;
        }

        const analysisType = document.getElementById('deep-composition-type-select')?.value;
        const confidence = document.getElementById('deep-composition-confidence')?.value;
        const maxIterations = document.getElementById('deep-composition-iterations')?.value;

        const confidenceNum = parseFloat(confidence);
        if (isNaN(confidenceNum) || confidenceNum < 0.1 || confidenceNum > 1.0) {
            this.showNotification('Invalid Confidence', 'Confidence threshold must be between 0.1 and 1.0', 'error');
            return;
        }

        const iterationsNum = parseInt(maxIterations);
        if (isNaN(iterationsNum) || iterationsNum < 10 || iterationsNum > 1000) {
            this.showNotification('Invalid Iterations', 'Max iterations must be between 10 and 1000', 'error');
            return;
        }

        const parameters = {
            analysisType: analysisType,
            fileName: this.uploadedFiles.deepCompositionFile.name,
            fileContent: await this.readFileContent(this.uploadedFiles.deepCompositionFile),
            confidence: confidenceNum,
            maxIterations: iterationsNum,
            typeOfNet: 'TESTNET'
        };

        await this.executeTool('get-DeepComposition-analysis-with-sign', parameters);
    }

    async executeRegistry() {
        const operation = document.getElementById('registry-operation-select')?.value;
        const entityName = document.getElementById('registry-entity-name-input')?.value?.trim();
        const entityType = document.getElementById('registry-entity-type-select')?.value;
        const registryId = document.getElementById('registry-identifier-input')?.value?.trim();
        const metadata = document.getElementById('registry-metadata-input')?.value?.trim();

        if (!entityName) {
            this.showNotification('Missing Information', 'Please enter the Entity Name', 'error');
            return;
        }

        let parsedMetadata = null;
        if (metadata) {
            try {
                parsedMetadata = JSON.parse(metadata);
            } catch (error) {
                this.showNotification('Invalid Metadata', 'Please enter valid JSON format for metadata', 'error');
                return;
            }
        }

        const parameters = {
            operation: operation,
            entityName: entityName,
            entityType: entityType,
            registryId: registryId || null,
            metadata: parsedMetadata,
            typeOfNet: 'TESTNET'
        };

        await this.executeTool('get-Registry-operation-with-sign', parameters);
    }

    async executeComposedProof() {
        // Get company name and CIN from the form
        const companyName = document.getElementById('composed-company-name')?.value?.trim() || 'SREE PALANI ANDAVAR AGROS PRIVATE LIMITED';
        const cin = document.getElementById('composed-cin')?.value?.trim() || 'U01112TZ2022PTC039493';
        
        // Validate inputs
        if (!companyName || !cin) {
            this.showNotification('Missing Information', 'Please enter both Company Name and CIN', 'error');
            return;
        }

        // Prepare parameters for the composed proof
        const parameters = {
            companyName: companyName,
            cin: cin,
            typeOfNet: 'TESTNET'
        };

        // Use the standard tool execution method like other compliance proofs
        await this.executeTool('get-Composed-Compliance-verification-with-sign', parameters);
    }

    // =============================
    // EXECUTION UTILITIES
    // =============================
    
    async executeTool(toolName, parameters) {
        if (this.isAsyncMode) {
            await this.executeAsync(toolName, parameters);
        } else {
            await this.executeSync(toolName, parameters);
        }
    }

    async executeAsync(toolName, parameters) {
        console.log('🚀 executeAsync() called:', { toolName, parameters });
        
        const jobId = this.generateJobId();
        console.log('🏷️ Generated job ID:', jobId);
        
        const job = {
            id: jobId,
            toolName,
            parameters,
            status: 'pending',
            startTime: new Date(),
            result: null
        };

        this.jobs.set(jobId, job);
        console.log('📁 Job added to queue. Total jobs:', this.jobs.size);
        
        this.updateJobQueue();
        this.updateJobQueueIndicator();

        // Show initial pending state
        this.displayPendingJob(toolName);

        try {
            console.log('📤 Sending job start request to server...');
            const response = await fetch('/api/v1/jobs/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, toolName, parameters })
            });

            if (!response.ok) throw new Error('Failed to start job');

            console.log('✅ Job start request successful');
            job.status = 'running';
            this.updateJobQueue();
            this.showNotification(
                'Job Started',
                `${this.formatToolName(toolName)} is now running in background`,
                'info'
            );
        } catch (error) {
            console.error('❌ Job start failed:', error);
            job.status = 'failed';
            job.error = error.message;
            this.updateJobQueue();
            this.showNotification('Job Failed', error.message, 'error');
        }
    }

    async executeSync(toolName, parameters) {
        this.syncExecuting = true;
        this.displayExecutionProgress();

        const startTime = performance.now();
        let responseRef = null;
        let responseText = '';
        let result = null;

        try {
            const requestData = { toolName, parameters };
            
            // 🆕 Capture request details (Safe Addition)
            const requestDetails = {
                method: 'POST',
                url: '/api/v1/tools/execute',
                headers: { 'Content-Type': 'application/json' },
                body: requestData,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('/api/v1/tools/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            responseRef = response;
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            // 🆕 Capture response text safely
            responseText = await response.text();
            
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                result = { error: 'Invalid JSON response', rawResponse: responseText };
            }

            // 🆕 Capture HTTP response details safely
            this.captureHttpResponseSafely(requestDetails, responseRef, responseTime, responseText, result);
            
            this.displayResult(result);
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            // 🆕 Capture error response details safely
            this.captureHttpErrorSafely({
                method: 'POST',
                url: '/api/v1/tools/execute',
                body: { toolName, parameters }
            }, error, responseTime);
            
            this.displayError(error.message);
        } finally {
            this.syncExecuting = false;
        }
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // =============================
    // JOB MANAGEMENT
    // =============================
    
    initWebSocket() {
        if (!this.isAsyncMode) return;

        try {
            // ✅ FIX: Use correct port from current location
            const wsUrl = `ws://${window.location.hostname}:${window.location.port || '3005'}`;
            console.log('🔗 Connecting WebSocket to:', wsUrl);
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('✅ WebSocket connected to:', wsUrl);
            };
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('📨 WebSocket message received:', data);
                if (data.type === 'job_update') {
                    this.handleJobUpdate(data);
                }
            };
            this.websocket.onclose = () => {
            console.log('🔌 WebSocket disconnected, retrying in 5 seconds...');
            setTimeout(() => this.initWebSocket(), 5000);
            };
        this.websocket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
        };
        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
        }
    }

    handleJobUpdate(data) {
        const job = this.jobs.get(data.jobId);
        if (!job) return;

        Object.assign(job, {
            status: data.status,
            progress: data.progress,
            result: data.result,
            error: data.error
        });

        if (data.status === 'completed' || data.status === 'failed') {
            job.endTime = new Date();
            
            if (data.status === 'completed' && data.result) {
                this.displayResult(data.result);
            } else if (data.status === 'failed') {
                this.displayError(data.error || 'Job execution failed');
            }
            
            this.showNotification(
                data.status === 'completed' ? 'Job Completed' : 'Job Failed',
                `${this.formatToolName(job.toolName)} ${data.status}`,
                data.status === 'completed' ? 'success' : 'error'
            );
        }

        this.updateJobQueue();
        this.updateJobQueueIndicator();
    }

    updateJobQueue() {
        const container = document.getElementById('job-queue-list');
        if (!container) return;

        const jobs = Array.from(this.jobs.values()).reverse();
        
        if (jobs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <i class="fas fa-clock text-2xl mb-2 opacity-50"></i>
                    <p class="text-sm">No jobs in queue</p>
                </div>
            `;
            return;
        }

        container.innerHTML = jobs.map(job => this.renderJobItem(job)).join('');
    }

    renderJobItem(job) {
        const statusIcons = {
            pending: '⏳',
            running: '🔄',
            completed: '✅',
            failed: '❌'
        };

        return `
            <div class="job-item p-3 border-l-4 ${this.getJobBorderColor(job.status)} bg-gray-50 rounded">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="font-medium">${this.formatToolName(job.toolName)}</span>
                        <div class="text-sm text-gray-500">${job.startTime.toLocaleTimeString()}</div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span>${statusIcons[job.status] || '❓'}</span>
                        <span class="text-sm ${this.getJobStatusColor(job.status)}">${job.status}</span>
                    </div>
                </div>
                ${job.progress ? `
                    <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${job.progress}%"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateJobQueueIndicator() {
        const runningJobs = Array.from(this.jobs.values())
            .filter(job => job.status === 'running' || job.status === 'pending').length;
        
        const indicator = document.getElementById('job-queue-indicator');
        const counter = document.getElementById('running-jobs-count');
        
        if (counter) counter.textContent = runningJobs;
        if (indicator) {
            indicator.classList.toggle('hidden', runningJobs === 0 || !this.isAsyncMode);
        }
    }

    clearCompletedJobs() {
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.status === 'completed' || job.status === 'failed') {
                this.jobs.delete(jobId);
            }
        }
        this.updateJobQueue();
        this.updateJobQueueIndicator();
    }

    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    formatToolName(toolName) {
        return toolName
            .replace('get-', '')
            .replace('-with-sign', '')
            .replace('-compliance-verification', '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    getJobBorderColor(status) {
        const colors = {
            pending: 'border-yellow-400',
            running: 'border-blue-400',
            completed: 'border-green-400',
            failed: 'border-red-400'
        };
        return colors[status] || 'border-gray-400';
    }

    getJobStatusColor(status) {
        const colors = {
            pending: 'text-yellow-600',
            running: 'text-blue-600',
            completed: 'text-green-600',
            failed: 'text-red-600'
        };
        return colors[status] || 'text-gray-600';
    }

    // =============================
    // UI DISPLAY METHODS
    // =============================
    
    displayPendingJob(toolName) {
        const container = document.getElementById('execution-results');
        if (container) {
            container.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <div>
                            <h3 class="text-lg font-semibold text-blue-800">Job Started</h3>
                            <p class="text-blue-700">${this.formatToolName(toolName)} is running in background</p>
                            <p class="text-sm text-blue-600 mt-1">You can switch tabs freely</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    displayExecutionProgress() {
        const container = document.getElementById('execution-results');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p class="mt-4 text-gray-600">Generating ZK Proof...</p>
                    <p class="text-sm text-gray-500">This may take a few moments</p>
                    <p class="text-xs text-yellow-600 mt-2">⚠️ Sync mode - UI is blocked. Switch to Async for better experience.</p>
                </div>
            `;
        }
    }

    displayResult(result) {
        const container = document.getElementById('execution-results');
        if (!container) return;

        if (result.success) {
            container.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex items-center mb-3">
                        <div class="text-green-600 text-2xl mr-3">✅</div>
                        <div>
                            <h3 class="text-lg font-semibold text-green-800">Success</h3>
                            <p class="text-green-700">ZK Proof Generated Successfully</p>
                        </div>
                    </div>
                    <div class="text-sm text-green-600 space-y-1">
                        <p><strong>Tool:</strong> ${result.toolName || 'ZK Proof Generation'}</p>
                        <p><strong>Status:</strong> ZK Proof Generated</p>
                        <p><strong>Time:</strong> ${result.executionTime || 'N/A'}</p>
                    </div>
                    ${result.result?.output ? `
                        <div class="mt-4 p-3 bg-gray-100 rounded-lg">
                            <h4 class="font-medium text-gray-700 mb-2">Output:</h4>
                            <pre class="text-sm text-gray-600 whitespace-pre-wrap">${result.result.output.substring(0, 500)}${result.result.output.length > 500 ? '...' : ''}</pre>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            this.displayError(result.error || 'Unknown error');
        }
    }

    displayError(message) {
        const container = document.getElementById('execution-results');
        if (container) {
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <div class="text-red-600 text-2xl mr-3">❌</div>
                        <div>
                            <h3 class="text-lg font-semibold text-red-800">Failed</h3>
                            <p class="text-red-700">${message}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // =============================
    // COMPOSED PROOFS UTILITIES
    // =============================
    
    getSelectedTemplate() {
        return window.selectedComposedTemplate || null;
    }

    collectGlobalParameters() {
        return {
            companyName: document.getElementById('composed-company-name')?.value?.trim() || 'SREE PALANI ANDAVAR AGROS PRIVATE LIMITED',
            cin: document.getElementById('composed-cin')?.value?.trim() || 'U01112TZ2022PTC039493'
        };
    }

    collectExecutionOptions() {
        return {
            command: 'node ./build/tests/with-sign/ComposedRecursiveOptim3LevelVerificationTestWithSign.js',
            environment: 'LOCAL'
        };
    }

    showComposedProofProgress() {
        const progressDiv = document.getElementById('composed-proof-progress');
        if (progressDiv) {
            progressDiv.classList.remove('hidden');
            document.getElementById('progress-details').innerHTML = `
                <div class="flex items-center mb-4">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    <span class="text-blue-700 font-medium">Executing Composed Proof...</span>
                </div>
                <p class="text-sm text-gray-600">Running multiple verification components</p>
            `;
        }
    }

    hideComposedProofProgress() {
        const progressDiv = document.getElementById('composed-proof-progress');
        if (progressDiv) {
            progressDiv.classList.add('hidden');
        }
    }

    displayComposedProofResult(result) {
        this.hideComposedProofProgress();
        const container = document.getElementById('execution-results');
        
        if (!container) return;

        if (result.success) {
            container.innerHTML = `
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div class="flex items-center mb-3">
                        <div class="text-purple-600 text-2xl mr-3">🎯</div>
                        <div>
                            <h3 class="text-lg font-semibold text-purple-800">Composed Proof Completed</h3>
                            <p class="text-purple-700">Multi-component verification successful</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium text-gray-700">Overall Verdict:</span>
                            <span class="text-purple-600 font-bold">${result.overallVerdict}</span>
                        </div>
                        <div>
                            <span class="font-medium text-gray-700">Execution ID:</span>
                            <span class="text-gray-600">${result.executionId?.substring(0, 8)}...</span>
                        </div>
                        <div>
                            <span class="font-medium text-gray-700">Total Components:</span>
                            <span class="text-gray-600">${result.aggregatedResult?.totalComponents || 0}</span>
                        </div>
                        <div>
                            <span class="font-medium text-gray-700">Execution Time:</span>
                            <span class="text-gray-600">${result.executionMetrics?.totalExecutionTime || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="mt-4 flex space-x-4">
                        <div class="text-center">
                            <div class="text-green-600 text-xl font-bold">${result.aggregatedResult?.passedComponents || 0}</div>
                            <div class="text-xs text-green-600">Passed</div>
                        </div>
                        <div class="text-center">
                            <div class="text-red-600 text-xl font-bold">${result.aggregatedResult?.failedComponents || 0}</div>
                            <div class="text-xs text-red-600">Failed</div>
                        </div>
                    </div>
                    ${result.componentResults && result.componentResults.length > 0 ? `
                        <div class="mt-4">
                            <h4 class="font-medium text-gray-700 mb-2">Component Results:</h4>
                            <div class="space-y-1">
                                ${result.componentResults.map(comp => `
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-gray-600">${comp.componentId}</span>
                                        <span class="px-2 py-1 rounded text-xs ${comp.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${comp.status}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            this.displayError(result.error || 'Composed proof execution failed');
        }
    }

    // =============================
    // NOTIFICATION SYSTEM (Missing Method)
    // =============================
    
    showNotification(title, message, type = 'info') {
        try {
            const notificationsContainer = document.getElementById('notifications');
            if (!notificationsContainer) {
                console.warn('Notifications container not found, falling back to console');
                console.log(`${type.toUpperCase()}: ${title} - ${message}`);
                return;
            }
            
            const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            
            const notification = document.createElement('div');
            notification.id = notificationId;
            notification.className = `notification animate-slide-in mb-3 p-4 rounded-lg shadow-lg border-l-4 ${
                type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
                type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
                type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
                'bg-blue-50 border-blue-400 text-blue-800'
            }`;
            
            const iconClass = {
                success: 'fa-check-circle text-green-600',
                error: 'fa-exclamation-triangle text-red-600',
                warning: 'fa-exclamation-triangle text-yellow-600',
                info: 'fa-info-circle text-blue-600'
            }[type] || 'fa-info-circle text-blue-600';
            
            notification.innerHTML = `
                <div class="flex items-start">
                    <i class="fas ${iconClass} mt-0.5 mr-3 flex-shrink-0"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold">${title}</h4>
                        <p class="text-sm mt-1">${message}</p>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            notificationsContainer.appendChild(notification);
            
            // Auto-remove after delay
            setTimeout(() => {
                const notificationEl = document.getElementById(notificationId);
                if (notificationEl) {
                    notificationEl.style.transition = 'opacity 0.3s ease';
                    notificationEl.style.opacity = '0';
                    setTimeout(() => {
                        if (notificationEl.parentNode) {
                            notificationEl.parentNode.removeChild(notificationEl);
                        }
                    }, 300);
                }
            }, type === 'error' ? 8000 : 5000); // Errors stay longer
            
        } catch (error) {
            console.error('Failed to show notification (non-critical):', error);
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }
    
    formatTimeAgo(timestamp) {
        try {
            const now = new Date();
            const time = new Date(timestamp);
            const diffMs = now - time;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            return `${diffDays}d ago`;
        } catch (error) {
            return 'unknown';
        }
    }

    // =============================
    // SYSTEM STATUS & CONNECTION
    // =============================
    
    updateModeDisplay() {
        const jobQueuePanel = document.getElementById('job-queue-panel');
        const jobQueueIndicator = document.getElementById('job-queue-indicator');
        
        if (jobQueuePanel) {
            jobQueuePanel.style.display = this.isAsyncMode ? 'block' : 'none';
        }
        
        if (jobQueueIndicator && !this.isAsyncMode) {
            jobQueueIndicator.classList.add('hidden');
        }
    }

    async checkConnection() {
        try {
            const response = await fetch('/api/v1/health');
            const health = await response.json();
            this.updateConnectionStatus(true);
            this.updateServerStatus(health);
        } catch (error) {
            this.updateConnectionStatus(false);
            this.updateServerStatus({ 
                status: 'offline', 
                services: { zkPretServer: false }, 
                timestamp: new Date().toISOString() 
            });
        }
    }

    updateConnectionStatus(connected) {
        const status = document.getElementById('connection-status');
        if (status) {
            status.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}"></div>
                    <span class="${connected ? 'text-green-600' : 'text-red-600'}">${connected ? 'Connected' : 'Disconnected'}</span>
                </div>
            `;
        }
    }

    updateServerStatus(status) {
        const container = document.getElementById('server-status');
        if (container) {
            container.innerHTML = `
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Status:</span>
                        <span class="font-medium">${status.status || 'unknown'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">ZK-PRET Server:</span>
                        <span class="${status.services?.zkPretServer ? 'text-green-600' : 'text-red-600'}">
                            ${status.services?.zkPretServer ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    ${status.services?.asyncJobs !== undefined ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600">Async Jobs:</span>
                            <span class="${status.services?.asyncJobs ? 'text-green-600' : 'text-orange-600'}">
                                ${status.services?.asyncJobs ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    ` : ''}
                    <div class="text-xs text-gray-500">
                        Last updated: ${new Date(status.timestamp).toLocaleString()}
                    </div>
                </div>
            `;
        }
    }

    // 🆕 Copy raw HTTP response
    copyHttpRawResponse() {
        try {
            if (!this.lastHttpResponseData) return;
            
            const { request, response } = this.lastHttpResponseData;
            
            const rawResponse = `HTTP/1.1 ${response.status} ${response.statusText}
${response.headers ? Object.entries(response.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n') : ''}

${response.body || ''}`;

            navigator.clipboard.writeText(rawResponse).then(() => {
                this.showNotification(
                    'Copied!',
                    'Raw HTTP response copied to clipboard',
                    'success'
                );
            }).catch(() => {
                this.showNotification(
                    'Copy Failed',
                    'Failed to copy response to clipboard',
                    'error'
                );
            });
        } catch (error) {
            console.warn('HTTP Response copy failed (non-critical):', error);
        }
    }

    // =============================
    // HTTP RESPONSE TRACKING (Safe Addition)
    // =============================
    
    captureHttpResponseSafely(requestDetails, response, responseTime, responseText, result) {
        if (!this.httpResponseEnabled) return;
        
        console.log('📝 HTTP Response captured:', {
            status: response?.status,
            responseTime: Math.round(responseTime) + 'ms',
            bodySize: responseText ? responseText.length : 0
        });
        
        try {
            // Safely extract response headers
            let headers = {};
            if (response && response.headers) {
                if (typeof response.headers.forEach === 'function') {
                    response.headers.forEach((value, key) => {
                        headers[key] = value;
                    });
                } else if (typeof response.headers.entries === 'function') {
                    for (const [key, value] of response.headers.entries()) {
                        headers[key] = value;
                    }
                }
            }
            
            const responseData = {
                request: {
                    method: requestDetails.method || 'POST',
                    url: requestDetails.url || '/api/v1/tools/execute',
                    headers: requestDetails.headers || {},
                    body: JSON.stringify(requestDetails.body, null, 2),
                    timestamp: requestDetails.timestamp || new Date().toISOString()
                },
                response: {
                    status: response?.status || 0,
                    statusText: response?.statusText || 'Unknown',
                    headers: headers,
                    body: responseText || '',
                    size: responseText ? responseText.length : 0,
                    time: Math.round(responseTime) + 'ms'
                },
                result: result,
                success: result?.success !== false && (response?.status >= 200 && response?.status < 300)
            };
            
            this.lastHttpResponseData = responseData;
            
            // Add to history
            this.addToHttpResponseHistory(responseData);
            
            this.updateHttpResponseUI();
            
        } catch (error) {
            console.warn('HTTP Response capture failed (non-critical):', error);
        }
    }
    
    captureHttpErrorSafely(requestDetails, error, responseTime) {
        if (!this.httpResponseEnabled) return;
        
        try {
            const errorResponseData = {
                request: {
                    method: requestDetails.method || 'POST',
                    url: requestDetails.url || '/api/v1/tools/execute',
                    headers: requestDetails.headers || {},
                    body: JSON.stringify(requestDetails.body, null, 2),
                    timestamp: new Date().toISOString()
                },
                response: {
                    status: 0,
                    statusText: 'Network Error',
                    headers: {},
                    body: error.message || 'Network request failed',
                    size: (error.message || '').length,
                    time: Math.round(responseTime) + 'ms'
                },
                result: null,
                error: error,
                success: false
            };
            
            this.lastHttpResponseData = errorResponseData;
            
            // Add to history
            this.addToHttpResponseHistory(errorResponseData);
            
            this.updateHttpResponseUI();
            
        } catch (err) {
            console.warn('HTTP Error capture failed (non-critical):', err);
        }
    }
    
    updateHttpResponseUI() {
        if (!this.lastHttpResponseData) return;
        
        try {
            const container = document.getElementById('http-resp-container');
            if (container) {
                container.style.display = 'block';
                console.log('🔍 HTTP Response container shown');
            }
            
            // Update summary
            this.updateHttpResponseSummary();
            
            // Update detailed view if visible
            if (this.httpRespDetailedViewVisible) {
                this.updateHttpResponseDetails();
            }
            
        } catch (error) {
            console.warn('HTTP Response UI update failed (non-critical):', error);
        }
    }
    
    updateHttpResponseSummary() {
        if (!this.lastHttpResponseData) return;
        
        const { response } = this.lastHttpResponseData;
        
        // Update status
        const statusEl = document.getElementById('http-resp-status');
        if (statusEl) {
            statusEl.textContent = `${response.status} ${response.statusText}`;
            statusEl.className = `http-resp-status-badge ${this.getStatusBadgeClass(response.status)}`;
        }
        
        // Update timing
        const timeEl = document.getElementById('http-resp-time');
        if (timeEl) {
            timeEl.textContent = response.time;
        }
        
        // Update size
        const sizeEl = document.getElementById('http-resp-size');
        if (sizeEl) {
            sizeEl.textContent = this.formatBytes(response.size);
        }
        
        // Update content type
        const contentTypeEl = document.getElementById('http-resp-content-type');
        if (contentTypeEl) {
            const contentType = response.headers['content-type'] || response.headers['Content-Type'] || 'unknown';
            contentTypeEl.textContent = contentType.split(';')[0]; // Remove charset part
        }
    }
    
    updateHttpResponseDetails() {
        if (!this.lastHttpResponseData) return;
        
        const { request, response } = this.lastHttpResponseData;
        const detailsEl = document.getElementById('http-resp-details');
        
        if (!detailsEl) return;
        
        try {
            let requestBodyFormatted = request.body;
            let responseBodyFormatted = response.body;
            
            // Try to format JSON
            try {
                const requestObj = JSON.parse(request.body);
                requestBodyFormatted = this.formatJsonWithSyntaxHighlighting(requestObj);
            } catch (e) {
                // Not JSON, use as-is
            }
            
            try {
                const responseObj = JSON.parse(response.body);
                responseBodyFormatted = this.formatJsonWithSyntaxHighlighting(responseObj);
            } catch (e) {
                // Not JSON, use as-is
                responseBodyFormatted = `<pre class="text-sm text-gray-700">${this.escapeHtml(response.body)}</pre>`;
            }
            
            detailsEl.innerHTML = `
                <!-- Request Details -->
                <div class="http-resp-collapsible-header bg-gray-50 px-3 py-2 rounded-t border border-gray-200 flex items-center justify-between" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <h4 class="font-medium text-gray-700 flex items-center">
                        <i class="fas fa-arrow-up text-blue-600 mr-2"></i>
                        Request Details
                    </h4>
                    <i class="fas fa-chevron-down text-gray-400"></i>
                </div>
                <div class="border border-t-0 border-gray-200 rounded-b mb-4">
                    <div class="p-3 space-y-3">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div><span class="font-medium text-gray-600">Method:</span> <code class="bg-gray-100 px-2 py-1 rounded">${request.method}</code></div>
                            <div><span class="font-medium text-gray-600">URL:</span> <code class="bg-gray-100 px-2 py-1 rounded text-xs">${request.url}</code></div>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Request Body:</span>
                            <div class="mt-1 http-resp-content">
                                ${requestBodyFormatted}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Response Details -->
                <div class="http-resp-collapsible-header bg-gray-50 px-3 py-2 rounded-t border border-gray-200 flex items-center justify-between" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <h4 class="font-medium text-gray-700 flex items-center">
                        <i class="fas fa-arrow-down text-green-600 mr-2"></i>
                        Response Details
                    </h4>
                    <i class="fas fa-chevron-down text-gray-400"></i>
                </div>
                <div class="border border-t-0 border-gray-200 rounded-b mb-4">
                    <div class="p-3 space-y-3">
                        <div>
                            <span class="font-medium text-gray-600">Response Headers:</span>
                            <div class="mt-1 text-xs bg-gray-100 p-2 rounded">
                                ${Object.entries(response.headers).length > 0 
                                    ? Object.entries(response.headers).map(([key, value]) => `${key}: ${value}`).join('\n')
                                    : 'No headers captured'
                                }
                            </div>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Response Body:</span>
                            <div class="mt-1 http-resp-content">
                                ${responseBodyFormatted}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="flex space-x-2">
                    <button onclick="window.app?.copyHttpRawResponse?.()" class="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                        <i class="fas fa-copy mr-1"></i>Copy Raw Response
                    </button>
                    <button onclick="window.app?.toggleHttpResponseDetails?.()" class="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                        <i class="fas fa-eye-slash mr-1"></i>Hide Details
                    </button>
                </div>
            `;
            
        } catch (error) {
            console.warn('HTTP Response details update failed (non-critical):', error);
            detailsEl.innerHTML = '<p class="text-red-600 text-sm">Failed to render response details</p>';
        }
    }
    
    toggleHttpResponseDetails() {
        try {
            const detailsEl = document.getElementById('http-resp-details');
            const toggleTextEl = document.getElementById('http-resp-toggle-text');
            
            if (detailsEl && toggleTextEl) {
                this.httpRespDetailedViewVisible = !this.httpRespDetailedViewVisible;
                
                if (this.httpRespDetailedViewVisible) {
                    detailsEl.classList.remove('hidden');
                    toggleTextEl.textContent = 'Hide Details';
                    this.updateHttpResponseDetails();
                } else {
                    detailsEl.classList.add('hidden');
                    toggleTextEl.textContent = 'Show Details';
                }
            }
        } catch (error) {
            console.warn('HTTP Response toggle failed (non-critical):', error);
        }
    }
    
    formatJsonWithSyntaxHighlighting(obj) {
        try {
            const jsonStr = JSON.stringify(obj, null, 2);
            return `<div class="http-resp-json-viewer">${this.highlightJson(jsonStr)}</div>`;
        } catch (error) {
            return `<pre class="text-sm text-gray-700">${this.escapeHtml(JSON.stringify(obj))}</pre>`;
        }
    }
    
    highlightJson(jsonStr) {
        return jsonStr
            .replace(/"([^"]+)":/g, '<span class="http-resp-json-key">"$1":</span>')
            .replace(/"([^"]*)"/g, '<span class="http-resp-json-string">"$1"</span>')
            .replace(/\b(\d+\.?\d*)\b/g, '<span class="http-resp-json-number">$1</span>')
            .replace(/\b(true|false)\b/g, '<span class="http-resp-json-boolean">$1</span>')
            .replace(/\bnull\b/g, '<span class="http-resp-json-null">null</span>');
    }
    
    getStatusBadgeClass(status) {
        if (status >= 200 && status < 300) return 'http-resp-status-2xx';
        if (status >= 300 && status < 400) return 'http-resp-status-3xx';
        if (status >= 400 && status < 500) return 'http-resp-status-4xx';
        if (status >= 500) return 'http-resp-status-5xx';
        return 'http-resp-status-error';
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // =============================
    // HTTP RESPONSE HISTORY MANAGEMENT (Safe Addition)
    // =============================
    
    addToHttpResponseHistory(responseData) {
        if (!this.httpResponseEnabled) return;
        
        try {
            // Add timestamp and execution mode info
            const historyEntry = {
                ...responseData,
                timestamp: new Date().toISOString(),
                executionMode: this.isAsyncMode ? 'async' : 'sync',
                id: this.generateHttpResponseId()
            };
            
            // Add to beginning of array
            this.httpResponseHistory.unshift(historyEntry);
            
            // Keep only the most recent entries
            if (this.httpResponseHistory.length > this.maxHttpResponseHistorySize) {
                this.httpResponseHistory = this.httpResponseHistory.slice(0, this.maxHttpResponseHistorySize);
            }
            
            // Update history UI
            this.updateHttpResponseHistoryUI();
            
        } catch (error) {
            console.warn('Failed to add HTTP response to history (non-critical):', error);
        }
    }
    
    generateHttpResponseId() {
        return `http_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    updateHttpResponseHistoryUI() {
        if (!this.httpResponseEnabled) return;
        
        try {
            const historyContainer = document.getElementById('execution-history');
            if (!historyContainer) return;
            
            if (this.httpResponseHistory.length === 0) {
                historyContainer.innerHTML = `
                    <div class="text-center py-4 text-gray-500">
                        <p class="text-sm">No HTTP response history available</p>
                    </div>
                `;
                return;
            }
            
            // Show recent HTTP responses with limited details
            const historyHtml = this.httpResponseHistory.slice(0, 5).map(entry => {
                const statusClass = this.getStatusBadgeClass(entry.response.status);
                const isSuccess = entry.success;
                const modeIcon = entry.executionMode === 'async' ? 'fa-clock' : 'fa-bolt';
                
                return `
                    <div class="border-l-4 ${isSuccess ? 'border-green-400' : 'border-red-400'} bg-gray-50 p-3 mb-2 rounded cursor-pointer hover:bg-gray-100 transition-colors" onclick="window.app?.loadHttpResponseFromHistory?.('${entry.id}')">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-2">
                                <i class="fas ${modeIcon} text-xs text-gray-500"></i>
                                <span class="http-resp-status-badge ${statusClass} text-xs">${entry.response.status}</span>
                                <span class="text-xs text-gray-600">${entry.response.time}</span>
                            </div>
                            <span class="text-xs text-gray-500">${this.formatTimeAgo(entry.timestamp)}</span>
                        </div>
                        <div class="text-xs text-gray-700 truncate">
                            ${entry.request.method} ${entry.request.url}
                        </div>
                        <div class="text-xs text-gray-500 mt-1 truncate">
                            ${this.formatBytes(entry.response.size)} • ${entry.executionMode} mode
                        </div>
                    </div>
                `;
            }).join('');
            
            historyContainer.innerHTML = `
                <div class="space-y-2">
                    ${historyHtml}
                    ${this.httpResponseHistory.length > 5 ? `
                        <div class="text-center py-2">
                            <button onclick="window.app?.showAllHttpHistory?.()" class="text-xs text-blue-600 hover:text-blue-800 underline">
                                View all ${this.httpResponseHistory.length} entries
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            
        } catch (error) {
            console.warn('HTTP Response history UI update failed (non-critical):', error);
        }
    }
    
    loadHttpResponseFromHistory(responseId) {
        try {
            const historyEntry = this.httpResponseHistory.find(entry => entry.id === responseId);
            if (historyEntry) {
                this.lastHttpResponseData = historyEntry;
                this.updateHttpResponseUI();
                
                // Show the HTTP response section if it's hidden
                const container = document.getElementById('http-resp-container');
                if (container) {
                    container.style.display = 'block';
                }
                
                this.showNotification(
                    'Response Loaded',
                    'Historical HTTP response loaded in the sidebar',
                    'info'
                );
            }
        } catch (error) {
            console.warn('Failed to load HTTP response from history (non-critical):', error);
        }
    }
    
    showAllHttpHistory() {
        try {
            const modal = this.createHttpHistoryModal();
            document.body.appendChild(modal);
        } catch (error) {
            console.warn('Failed to show HTTP history modal (non-critical):', error);
        }
    }
    
    createHttpHistoryModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden flex flex-col';
        modalContent.onclick = (e) => e.stopPropagation();
        
        const historyRows = this.httpResponseHistory.map(entry => {
            const statusClass = this.getStatusBadgeClass(entry.response.status);
            const modeIcon = entry.executionMode === 'async' ? 'fa-clock' : 'fa-bolt';
            
            return `
                <tr class="hover:bg-gray-50 cursor-pointer" onclick="window.app?.loadHttpResponseFromHistory?.('${entry.id}'); this.closest('.fixed').remove();">
                    <td class="px-4 py-3 text-sm">
                        <div class="flex items-center space-x-2">
                            <i class="fas ${modeIcon} text-xs text-gray-500"></i>
                            <span>${new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-sm">
                        <span class="http-resp-status-badge ${statusClass}">${entry.response.status}</span>
                    </td>
                    <td class="px-4 py-3 text-sm">${entry.request.method}</td>
                    <td class="px-4 py-3 text-sm font-mono text-xs truncate max-w-xs">${entry.request.url}</td>
                    <td class="px-4 py-3 text-sm">${entry.response.time}</td>
                    <td class="px-4 py-3 text-sm">${this.formatBytes(entry.response.size)}</td>
                    <td class="px-4 py-3 text-sm">
                        <span class="px-2 py-1 text-xs rounded ${entry.executionMode === 'async' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                            ${entry.executionMode}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
        
        modalContent.innerHTML = `
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">HTTP Response History</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="flex-1 overflow-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${historyRows}
                    </tbody>
                </table>
            </div>
            <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
                Click on any row to load that response in the sidebar. Total entries: ${this.httpResponseHistory.length}
            </div>
        `;
        
        modal.appendChild(modalContent);
        return modal;
    }
    
    formatTimeAgo(timestamp) {
        try {
            const now = new Date();
            const time = new Date(timestamp);
            const diffMs = now.getTime() - time.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}d ago`;
        } catch (error) {
            return 'unknown';
        }
    }
    
    // Test method to verify HTTP response display (for debugging)
    testHttpResponseDisplay() {
        console.log('🧪 Testing HTTP Response Display...');
        
        // Create a mock response to test the UI
        const mockResponseData = {
            request: {
                method: 'POST',
                url: '/api/v1/tools/execute',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toolName: 'test', parameters: {} }, null, 2),
                timestamp: new Date().toISOString()
            },
            response: {
                status: 200,
                statusText: 'OK',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ success: true, message: 'Test response' }),
                size: 45,
                time: '150ms'
            },
            result: { success: true, message: 'Test response' },
            success: true
        };
        
        this.lastHttpResponseData = mockResponseData;
        this.addToHttpResponseHistory(mockResponseData);
        this.updateHttpResponseUI();
        
        console.log('✅ Mock HTTP response added - check sidebar!');
    }
    
    // Helper methods for HTTP response display
    getStatusBadgeClass(status) {
        if (status >= 200 && status < 300) return 'http-resp-status-2xx';
        if (status >= 300 && status < 400) return 'http-resp-status-3xx';
        if (status >= 400 && status < 500) return 'http-resp-status-4xx';
        if (status >= 500) return 'http-resp-status-5xx';
        return 'http-resp-status-error';
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // =============================
    // NOTIFICATION SYSTEM
    // =============================
    
    showNotification(title, message, type = 'info') {
        const notification = this.createNotification(title, message, type);
        const container = document.getElementById('notifications');
        
        if (container) {
            container.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
        }
    }

    createNotification(title, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} bg-white border-l-4 p-4 rounded-lg shadow-lg max-w-md mb-2 animate-slide-in`;
        
        const borderColors = {
            success: 'border-green-500',
            error: 'border-red-500',
            warning: 'border-yellow-500',
            info: 'border-blue-500'
        };
        
        notification.classList.add(borderColors[type] || borderColors.info);
        
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${title}</h4>
                    <p class="text-gray-600 text-sm mt-1">${message}</p>
                </div>
                <button class="ml-4 text-gray-400 hover:text-gray-600 font-bold text-lg" onclick="this.parentElement.parentElement.remove()">
                    ×
                </button>
            </div>
        `;
        
        return notification;
    }
}

// =============================
// GLOBAL UTILITY FUNCTIONS
// =============================

// File management functions for global access
function clearDataFile() {
    if (window.app) window.app.clearDataFile();
}

function clearActualProcessFile() {
    if (window.app) window.app.clearActualProcessFile();
}

function clearExpectedProcessFile() {
    if (window.app) window.app.clearExpectedProcessFile();
}

function clearDeepCompositionFile() {
    if (window.app) window.app.clearDeepCompositionFile();
}

// Composed proof template selection
function selectComposedProofTemplate(templateId) {
    window.selectedComposedTemplate = templateId;
    
    // Update UI to show selected template
    const selectedInfo = document.getElementById('selected-template-info');
    const templateName = document.getElementById('selected-template-name');
    const templateDetails = document.getElementById('template-details');
    
    if (selectedInfo && templateName) {
        selectedInfo.classList.remove('hidden');
        templateName.textContent = templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Show template-specific details
        const templates = {
            'composed-compliance-template': {
                description: 'Combines GLEIF entity verification, Corporate Registration validation, and EXIM trade compliance checks',
                components: ['GLEIF Verification', 'Corporate Registration', 'EXIM Verification (Optional)'],
                aggregation: 'All Required (2 out of 3, EXIM optional)',
                estimatedTime: '2-5 minutes'
            },
            'business-integrity-check': {
                description: 'Verifies business data integrity and process compliance',
                components: ['Business Standard Data Integrity', 'Business Process Integrity'],
                aggregation: 'All Components Required',
                estimatedTime: '2-4 minutes'
            },
            'comprehensive-compliance': {
                description: 'Complete compliance verification combining all major regulatory checks',
                components: ['KYC Phase', 'Risk Assessment Phase', 'Integrity Verification Phase'],
                aggregation: 'Weighted Multi-Phase (KYC: 40%, Risk: 35%, Integrity: 25%)',
                estimatedTime: '8-15 minutes'
            }
        };
        
        const template = templates[templateId];
        if (template && templateDetails) {
            templateDetails.innerHTML = `
                <div class="space-y-3">
                    <div>
                        <h5 class="font-medium text-gray-800">Description:</h5>
                        <p class="text-sm text-gray-600">${template.description}</p>
                    </div>
                    <div>
                        <h5 class="font-medium text-gray-800">Components:</h5>
                        <div class="flex flex-wrap gap-2 mt-1">
                            ${template.components.map(comp => `
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${comp}</span>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h5 class="font-medium text-gray-800">Aggregation:</h5>
                        <p class="text-sm text-gray-600">${template.aggregation}</p>
                    </div>
                    <div>
                        <h5 class="font-medium text-gray-800">Estimated Time:</h5>
                        <p class="text-sm text-gray-600">${template.estimatedTime}</p>
                    </div>
                </div>
            `;
        }
    }
    
    // Highlight selected template
    document.querySelectorAll('.bg-white.rounded-lg.p-4.border').forEach(el => {
        el.classList.remove('ring-2', 'ring-purple-500', 'border-purple-300');
    });
    
    const selectedCard = event?.target?.closest('.bg-white.rounded-lg.p-4.border');
    if (selectedCard) {
        selectedCard.classList.add('ring-2', 'ring-purple-500', 'border-purple-300');
    }
    
    if (window.app) {
        window.app.showNotification(
            'Template Selected',
            `${templateName?.textContent} composition template selected`,
            'info'
        );
    }
}

// Load available templates
async function loadAvailableTemplates() {
    const button = document.getElementById('load-templates-btn');
    if (!button) return;
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
    button.disabled = true;
    
    try {
        const response = await fetch('/api/v1/composed-proofs/templates');
        const data = await response.json();
        
        if (data.templates && data.templates.length > 0) {
            if (window.app) {
                window.app.showNotification(
                    'Templates Loaded',
                    `Found ${data.total} available composition templates`,
                    'success'
                );
            }
            console.log('Available templates:', data.templates);
        } else {
            if (window.app) {
                window.app.showNotification(
                    'No Templates',
                    'No composition templates found on server',
                    'warning'
                );
            }
        }
    } catch (error) {
        if (window.app) {
            window.app.showNotification(
                'Load Failed',
                'Failed to load templates from server',
                'error'
            );
        }
        console.error('Failed to load templates:', error);
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Test HTTP Response Display (Global function for debugging)
function testHttpResponse() {
    if (window.app && window.app.testHttpResponseDisplay) {
        window.app.testHttpResponseDisplay();
    } else {
        console.error('App not initialized or test method not available');
    }
}

// =============================
// APPLICATION INITIALIZATION
// =============================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOMContentLoaded event fired');
    
    // DIAGNOSTIC: Check if app already exists
    if (window.app) {
        console.warn('⚠️ App already exists! Possible duplicate initialization');
        console.log('Existing app:', window.app);
    }
    
    // DIAGNOSTIC: Track DOMContentLoaded calls
    window.domReadyCount = (window.domReadyCount || 0) + 1;
    console.log(`📊 DOMContentLoaded count: ${window.domReadyCount}`);
    if (window.domReadyCount > 1) {
        console.warn(`⚠️ Multiple DOMContentLoaded events detected! Count: ${window.domReadyCount}`);
    }
    
    // Initialize the main application
    window.app = new ZKPretAsyncApp();
    
    // Check if user came from home page with specific tab target
    const targetTab = sessionStorage.getItem('zkpret_target_tab');
    if (targetTab) {
        console.log('🎯 Target tab from sessionStorage:', targetTab);
        sessionStorage.removeItem('zkpret_target_tab');
        setTimeout(() => {
            if (window.app) {
                // Call appropriate special mode methods instead of regular tab switching
                if (targetTab === 'scf') {
                    console.log('🔄 Switching to SCF special mode');
                    window.app.showSCFOnly();
                } else if (targetTab === 'process-integrity') {
                    console.log('🔄 Switching to Process Integrity special mode');
                    window.app.showProcessIntegrityOnly();
                } else if (targetTab === 'data-integrity') {
                    console.log('🔄 Switching to Data Integrity special mode');
                    window.app.showDataIntegrityOnly();
                } else if (targetTab === 'risk') {
                    console.log('🔄 Switching to Risk special mode');
                    window.app.showRiskOnly();
                } else if (targetTab === 'registry') {
                    console.log('🔄 Switching to Registry special mode');
                    window.app.showRegistryOnly();
                } else if (targetTab === 'deep-composition') {
                    console.log('🔄 Switching to DeepComposition special mode');
                    window.app.showDeepCompositionOnly();
                } else if (window.app.switchTab) {
                    // For regular tabs (like compliance sub-tabs), use normal tab switching
                    window.app.switchTab(targetTab);
                }
            }
        }, 100);
    }
    
    console.log('🎉 ZK-PRET Application ready!');
});

// Add some CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
    
    .notification {
        transition: all 0.3s ease;
    }
    
    .notification:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);

// Export for global access
window.ZKPretAsyncApp = ZKPretAsyncApp;