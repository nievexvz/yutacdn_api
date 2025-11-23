// Image Upload Demo Application
class ImageUploadDemo {
    constructor() {
        this.currentFile = null;
        this.selectedProvider = null;
        this.initializeElements();
        this.bindEvents();
        this.updateBaseUrl();
    }

    initializeElements() {
        // DOM Elements
        this.dropArea = document.getElementById('dropArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.resultSection = document.getElementById('resultSection');
        this.resultContent = document.getElementById('resultContent');
        this.loading = document.getElementById('loading');
        this.loadingProvider = document.getElementById('loadingProvider');
        this.selectedProviderDiv = document.getElementById('selectedProvider');
        this.providerName = document.getElementById('providerName');
        this.baseUrlElement = document.getElementById('baseUrl');
        
        // Provider elements
        this.providerOptions = document.querySelectorAll('.provider-option');
    }

    bindEvents() {
        // Provider selection
        this.providerOptions.forEach(option => {
            option.addEventListener('click', () => this.selectProvider(option));
        });

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => this.highlightDropArea(), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => this.unhighlightDropArea(), false);
        });

        this.dropArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.dropArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadBtn.addEventListener('click', () => this.handleUpload());
    }

    updateBaseUrl() {
        const baseUrl = window.location.origin;
        this.baseUrlElement.textContent = baseUrl;
    }

    selectProvider(option) {
        // Remove previous selection
        this.providerOptions.forEach(opt => {
            const div = opt.querySelector('div');
            div.classList.remove('border-2', 'border-white/40', 'bg-white/20');
        });

        // Add selection to clicked option
        const div = option.querySelector('div');
        div.classList.add('border-2', 'border-white/40', 'bg-white/20');
        
        this.selectedProvider = option.dataset.provider;
        this.selectedProviderDiv.classList.remove('hidden');
        this.providerName.textContent = option.querySelector('.font-semibold').textContent;
        
        this.updateUploadButton();
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlightDropArea() {
        this.dropArea.classList.add('border-blue-500', 'bg-blue-500/10');
    }

    unhighlightDropArea() {
        this.dropArea.classList.remove('border-blue-500', 'bg-blue-500/10');
    }

    handleDrop(e) {
        const files = e.dataTransfer.files;
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = e.target.files;
        this.processFiles(files);
    }

    processFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                if (file.size > 32 * 1024 * 1024) {
                    this.showError('File size too large. Maximum size is 32MB');
                    return;
                }
                
                this.currentFile = file;
                this.showFilePreview(file);
                this.updateUploadButton();
            } else {
                this.showError('Please select a valid image file (JPG, PNG, GIF, etc.)');
            }
        }
    }

    showFilePreview(file) {
        this.dropArea.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="relative mb-4 group">
                    <img src="${URL.createObjectURL(file)}" alt="Preview" 
                         class="max-h-64 rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-105">
                </div>
                <p class="text-gray-300 text-lg">${file.name}</p>
                <p class="text-gray-400">${(file.size / 1024).toFixed(1)} KB</p>
            </div>
        `;
    }

    updateUploadButton() {
        this.uploadBtn.disabled = !(this.currentFile && this.selectedProvider);
    }

    async handleUpload() {
        if (!this.currentFile || !this.selectedProvider) {
            this.showError('Please select both a file and a provider');
            return;
        }

        this.showLoading();
        this.uploadBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('file', this.currentFile);

            const response = await fetch(`/api/${this.selectedProvider}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(data);
            } else {
                this.showUploadError(data);
            }
        } catch (error) {
            this.showNetworkError(error);
        } finally {
            this.hideLoading();
            this.uploadBtn.disabled = false;
        }
    }

    showLoading() {
        this.loadingProvider.textContent = this.providerName.textContent;
        this.loading.classList.remove('hidden');
        this.resultSection.classList.add('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }

    showSuccess(data) {
        this.resultContent.innerHTML = `
            <div class="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-6">
                <div class="flex items-center justify-center mb-4">
                    <div class="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-semibold text-green-300">Upload Successful!</h3>
                </div>
                <div class="text-center text-green-200">
                    <p class="text-lg">Your image has been uploaded to <span class="font-semibold text-white">${data.provider}</span></p>
                </div>
            </div>
            
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                    <div class="flex">
                        <input type="text" value="${data.url}" readonly 
                               class="flex-1 bg-gray-700 border border-gray-600 rounded-l-xl px-4 py-3 text-white text-lg font-mono">
                        <button onclick="app.copyToClipboard('${data.url}')" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-r-xl transition-all duration-300 font-semibold">
                            Copy
                        </button>
                    </div>
                </div>
                
                <div class="flex justify-center space-x-4">
                    <a href="${data.url}" target="_blank" 
                       class="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                        Open Image
                    </a>
                    <button onclick="app.uploadAnother()" 
                            class="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                        Upload Another
                    </button>
                </div>
            </div>
        `;
        this.resultSection.classList.remove('hidden');
    }

    showUploadError(data) {
        this.resultContent.innerHTML = `
            <div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <div class="flex items-center justify-center mb-4">
                    <div class="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-semibold text-red-300">Upload Failed</h3>
                </div>
                <div class="text-center">
                    <p class="text-red-200 text-lg mb-2">Error: ${data.error}</p>
                    <p class="text-red-300">Provider: ${data.provider}</p>
                </div>
            </div>
        `;
        this.resultSection.classList.remove('hidden');
    }

    showNetworkError(error) {
        this.resultContent.innerHTML = `
            <div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <div class="flex items-center justify-center mb-4">
                    <div class="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-semibold text-red-300">Network Error</h3>
                </div>
                <div class="text-center">
                    <p class="text-red-200 text-lg">${error.message}</p>
                </div>
            </div>
        `;
        this.resultSection.classList.remove('hidden');
    }

    showError(message) {
        alert(message);
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show temporary success message
            const originalText = this.uploadBtn.textContent;
            this.uploadBtn.textContent = '✓ Copied!';
            this.uploadBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            this.uploadBtn.classList.add('bg-green-500', 'hover:bg-green-600');
            
            setTimeout(() => {
                this.uploadBtn.textContent = originalText;
                this.uploadBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
                this.uploadBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            }, 2000);
        });
    }

    uploadAnother() {
        this.currentFile = null;
        this.selectedProvider = null;
        this.selectedProviderDiv.classList.add('hidden');
        
        // Reset drop area
        this.dropArea.innerHTML = document.getElementById('uploadPlaceholder').outerHTML;
        
        // Reset provider selection
        this.providerOptions.forEach(option => {
            const div = option.querySelector('div');
            div.classList.remove('border-2', 'border-white/40', 'bg-white/20');
        });
        
        this.resultSection.classList.add('hidden');
        this.updateUploadButton();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ImageUploadDemo();
});
