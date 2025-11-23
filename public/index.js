let currentFile = null;
let selectedProvider = null;

// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const loading = document.getElementById('loading');
const loadingProvider = document.getElementById('loadingProvider');
const selectedProviderDiv = document.getElementById('selectedProvider');
const providerName = document.getElementById('providerName');

// Provider selection
document.querySelectorAll('.provider-option').forEach(option => {
  option.addEventListener('click', () => {
    // Remove previous selection
    document.querySelectorAll('.provider-option > div').forEach(div => {
      div.classList.remove('border-2', 'border-white/40', 'bg-white/20');
    });
    
    // Add selection to clicked option
    const div = option.querySelector('div');
    div.classList.add('border-2', 'border-white/40', 'bg-white/20');
    
    selectedProvider = option.dataset.provider;
    selectedProviderDiv.classList.remove('hidden');
    providerName.textContent = option.querySelector('.font-semibold').textContent;
    
    updateUploadButton();
  });
});

// Drag and drop handlers
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => {
    dropArea.classList.add('border-blue-500', 'bg-blue-500/10');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => {
    dropArea.classList.remove('border-blue-500', 'bg-blue-500/10');
  }, false);
});

dropArea.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  handleFiles(files);
});

dropArea.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  if (files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      if (file.size > 32 * 1024 * 1024) {
        alert('File size too large. Maximum size is 32MB');
        return;
      }
      
      currentFile = file;
      dropArea.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="relative mb-4 group">
            <img src="${URL.createObjectURL(file)}" alt="Preview" class="max-h-64 rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-105">
          </div>
          <p class="text-gray-300 text-lg">${file.name}</p>
          <p class="text-gray-400">${(file.size / 1024).toFixed(1)} KB</p>
        </div>
      `;
      updateUploadButton();
    } else {
      alert('Please select a valid image file (JPG, PNG, GIF, etc.)');
    }
  }
}

function updateUploadButton() {
  uploadBtn.disabled = !(currentFile && selectedProvider);
}

uploadBtn.addEventListener('click', async () => {
  if (!currentFile || !selectedProvider) {
    alert('Please select both a file and a provider');
    return;
  }
  
  loadingProvider.textContent = providerName.textContent;
  loading.classList.remove('hidden');
  resultSection.classList.add('hidden');
  uploadBtn.disabled = true;
  
  try {
    const formData = new FormData();
    formData.append('file', currentFile);
    
    const response = await fetch(`/api/${selectedProvider}`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      resultContent.innerHTML = `
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
              <input type="text" value="${data.url}" readonly class="flex-1 bg-gray-700 border border-gray-600 rounded-l-xl px-4 py-3 text-white text-lg font-mono">
              <button onclick="copyToClipboard('${data.url}')" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-r-xl transition-all duration-300 font-semibold">
                Copy
              </button>
            </div>
          </div>
          
          <div class="flex justify-center space-x-4">
            <a href="${data.url}" target="_blank" class="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              Open Image
            </a>
            <button onclick="uploadAnother()" class="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
              Upload Another
            </button>
          </div>
        </div>
      `;
    } else {
      resultContent.innerHTML = `
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
    }
    
    resultSection.classList.remove('hidden');
  } catch (error) {
    resultContent.innerHTML = `
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
    resultSection.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
    uploadBtn.disabled = false;
  }
});

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show temporary success message
    const originalText = uploadBtn.textContent;
    uploadBtn.textContent = '✓ Copied!';
    uploadBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    uploadBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    
    setTimeout(() => {
      uploadBtn.textContent = originalText;
      uploadBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
      uploadBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }, 2000);
  });
}

function uploadAnother() {
  currentFile = null;
  selectedProvider = null;
  selectedProviderDiv.classList.add('hidden');
  
  // Reset drop area
  dropArea.innerHTML = document.getElementById('uploadPlaceholder').outerHTML;
  
  // Reset provider selection
  document.querySelectorAll('.provider-option > div').forEach(div => {
    div.classList.remove('border-2', 'border-white/40', 'bg-white/20');
  });
  
  resultSection.classList.add('hidden');
  updateUploadButton();
}

// Initialize
updateUploadButton();
