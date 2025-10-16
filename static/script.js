/**
 * Professional Stem Splitter JavaScript
 * Interactive features inspired by LALAL.AI and Moises.ai
 */

// Global variables
let currentJobId = null;
let progressInterval = null;
let isProcessing = false;
let stemProgress = {}; // Track individual stem progress

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    setupDragAndDrop();
    setupFileUpload();
    setupEventListeners();
    
    console.log('🎵 Professional Stem Splitter initialized');
}

/**
 * Setup drag and drop functionality
 */
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('audioFile');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);
    
    // Handle click to select file
    uploadArea.addEventListener('click', () => {
        if (!isProcessing) {
            fileInput.click();
        }
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        uploadArea.classList.add('dragging');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('dragging');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFileSelection(files[0]);
    }
}

/**
 * Setup file upload handling
 */
function setupFileUpload() {
    const fileInput = document.getElementById('audioFile');
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Modal close functionality
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('audioModal');
        if (e.target === modal) {
            closeAudioModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAudioModal();
        }
    });
}

/**
 * Handle file selection
 */
function handleFileSelection(file) {
    if (!file) {
        showNotification('Please select a valid audio file', 'error');
        return;
    }
    
    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/mpeg'];
    const allowedExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'];
    
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension && !allowedTypes.includes(file.type)) {
        showNotification('Please select a valid audio file (MP3, WAV, FLAC, M4A, AAC, OGG)', 'error');
        return;
    }
    
    // Check file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
        showNotification('File size must be less than 500MB', 'error');
        return;
    }
    
    // Start upload process
    uploadFile(file);
}

/**
 * Directory selection function
 */
function selectDirectory() {
    // For web security, we can't directly access file system
    // Instead, show input for manual entry with helpful suggestions
    const directoryInput = document.getElementById('outputDirectory');
    const suggestions = [
        '/home/student/Downloads',
        '/home/student/Music',
        '/home/student/Desktop',
        '/tmp/stems'
    ];
    
    const suggestion = prompt(
        'Enter output directory path:\n\nSuggestions:\n' + suggestions.join('\n') + '\n\nOr leave empty for default location:',
        directoryInput.value
    );
    
    if (suggestion !== null) {
        directoryInput.value = suggestion;
    }
}

/**
 * Upload file to server
 */
function uploadFile(file) {
    const formData = new FormData();
    formData.append('audio_file', file);
    
    const modelSelect = document.getElementById('modelSelect');
    const outputDirectory = document.getElementById('outputDirectory');
    formData.append('model', modelSelect.value);
    formData.append('output_directory', outputDirectory.value.trim());
    
    // Show processing section
    showProcessingSection(file.name, modelSelect.value);
    
    // Update UI state
    isProcessing = true;
    updateProcessingStatus('Uploading file...', 5);
    
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        currentJobId = data.job_id;
        showNotification('File uploaded successfully! Processing started...', 'success');
        startProgressTracking();
    })
    .catch(error => {
        console.error('Upload error:', error);
        showNotification(error.message, 'error');
        resetToUploadState();
    });
}

/**
 * Show processing section
 */
function showProcessingSection(fileName, modelName) {
    // Hide upload section
    document.getElementById('uploadSection').style.display = 'none';
    
    // Show processing section
    const processingSection = document.getElementById('processingSection');
    processingSection.style.display = 'block';
    
    // Update processing details
    const outputDirectory = document.getElementById('outputDirectory').value.trim();
    document.getElementById('fileName').textContent = fileName;
    document.getElementById('modelName').textContent = modelName.toUpperCase();
    document.getElementById('statusText').textContent = 'Starting...';
    document.getElementById('outputPath').textContent = outputDirectory || 'Default location';
    
    // Initialize stem progress tracking immediately
    initializeStemProgress(modelName);
    
    // Smooth scroll to processing section
    processingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Start progress tracking
 */
function startProgressTracking() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    progressInterval = setInterval(() => {
        if (currentJobId) {
            checkJobStatus(currentJobId);
        }
    }, 1000); // Check every second
}

/**
 * Check job status
 */
function checkJobStatus(jobId) {
    fetch(`/api/status/${jobId}`)
    .then(response => response.json())
    .then(data => {
        updateProgressUI(data);
        
        if (data.status === 'completed') {
            clearInterval(progressInterval);
            showResults(data);
        } else if (data.status === 'error') {
            clearInterval(progressInterval);
            showNotification(data.error || 'Processing failed', 'error');
            resetToUploadState();
        }
    })
    .catch(error => {
        console.error('Status check error:', error);
        clearInterval(progressInterval);
        showNotification('Failed to check processing status', 'error');
        resetToUploadState();
    });
}

/**
 * Initialize stem progress tracking
 */
function initializeStemProgress(modelName) {
    // Define stem types based on model
    let stemTypes = [];
    if (modelName === 'htdemucs_6s') {
        stemTypes = ['vocals', 'drums', 'bass', 'piano', 'guitar', 'other'];
    } else {
        stemTypes = ['vocals', 'drums', 'bass', 'other'];
    }
    
    // Reset stem progress
    stemProgress = {};
    stemTypes.forEach(stem => {
        stemProgress[stem] = {
            name: stem,
            progress: 0,
            status: 'waiting',
            completed: false
        };
    });
    
    // Create stem progress UI
    createStemProgressUI(stemTypes);
}

/**
 * Create stem progress UI elements
 */
function createStemProgressUI(stemTypes) {
    const stemProgressSection = document.getElementById('stemProgressSection');
    const stemProgressGrid = document.getElementById('stemProgressGrid');
    
    // Clear existing progress items
    stemProgressGrid.innerHTML = '';
    
    stemTypes.forEach(stemName => {
        const progressItem = document.createElement('div');
        progressItem.className = 'stem-progress-item';
        progressItem.id = `stem-progress-${stemName}`;
        
        const stemIcon = getStemIcon(stemName);
        
        progressItem.innerHTML = `
            <div class="stem-progress-header">
                <div class="stem-progress-name">
                    <i class="${stemIcon}"></i>
                    ${stemName}
                </div>
                <div class="stem-progress-status" id="stem-status-${stemName}">Waiting...</div>
            </div>
            <div class="stem-progress-bar">
                <div class="stem-progress-fill" id="stem-fill-${stemName}" style="width: 0%"></div>
            </div>
            <div class="stem-progress-actions">
                <button class="btn btn-primary btn-sm" id="play-${stemName}" onclick="playAudio(currentJobId, '${stemName}')">
                    <i class="fas fa-play"></i> Play
                </button>
                <button class="btn btn-secondary btn-sm" id="download-${stemName}" onclick="downloadStem(currentJobId, '${stemName}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
        
        stemProgressGrid.appendChild(progressItem);
    });
    
    // Show stem progress section
    stemProgressSection.style.display = 'block';
    console.log('Stem progress section initialized with', stemTypes.length, 'stems');
    
    // Force visibility
    setTimeout(() => {
        stemProgressSection.style.display = 'block';
        stemProgressSection.style.visibility = 'visible';
    }, 100);
}

/**
 * Update individual stem progress
 */
function updateStemProgress(stemName, progress, status = 'processing') {
    if (!stemProgress[stemName]) return;
    
    stemProgress[stemName].progress = progress;
    stemProgress[stemName].status = status;
    stemProgress[stemName].completed = progress >= 100;
    
    // Update UI elements
    const statusElement = document.getElementById(`stem-status-${stemName}`);
    const fillElement = document.getElementById(`stem-fill-${stemName}`);
    const progressItem = document.getElementById(`stem-progress-${stemName}`);
    const playButton = document.getElementById(`play-${stemName}`);
    const downloadButton = document.getElementById(`download-${stemName}`);
    
    if (statusElement) {
        statusElement.textContent = status === 'completed' ? 'Ready!' : `${Math.round(progress)}%`;
    }
    
    if (fillElement) {
        fillElement.style.width = `${progress}%`;
        if (progress >= 100) {
            fillElement.classList.add('completed');
        }
    }
    
    if (progressItem && progress >= 100) {
        progressItem.classList.add('completed');
    }
    
    // Enable buttons when completed
    if (playButton && downloadButton && progress >= 100) {
        playButton.classList.add('active');
        downloadButton.classList.add('active');
    }
}

/**
 * Update progress UI
 */
function updateProgressUI(jobData) {
    const progress = jobData.progress || 0;
    const status = jobData.status || 'unknown';
    
    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
    
    // Update status text
    const statusText = document.getElementById('statusText');
    const processingStatus = document.getElementById('processingStatus');
    
    let statusMessage = '';
    switch (status) {
        case 'queued':
            statusMessage = 'In queue...';
            break;
        case 'loading_model':
            statusMessage = 'Loading AI model...';
            updateAllStemProgress(10, 'loading');
            break;
        case 'loading_audio':
            statusMessage = 'Loading audio file...';
            updateAllStemProgress(20, 'loading');
            break;
        case 'separating_stems':
            statusMessage = 'Separating stems...';
            // Simulate individual stem progress during separation
            simulateStemProgress(progress);
            break;
        case 'saving_stems':
            statusMessage = 'Saving stems...';
            updateAllStemProgress(90, 'saving');
            break;
        case 'completed':
            statusMessage = 'Completed!';
            updateAllStemProgress(100, 'completed');
            break;
        case 'error':
            statusMessage = 'Error occurred';
            break;
        default:
            statusMessage = 'Processing...';
    }
    
    statusText.textContent = statusMessage;
    processingStatus.textContent = statusMessage;
}

/**
 * Show results
 */
function showResults(jobData) {
    // Hide processing section
    document.getElementById('processingSection').style.display = 'none';
    
    // Show results section
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    
    // Generate stems grid
    generateStemsGrid(jobData.stems, jobData.id);
    
    // Update UI state
    isProcessing = false;
    
    // Show success notification
    showNotification('Stem separation completed successfully!', 'success');
    
    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Generate stems grid
 */
function generateStemsGrid(stems, jobId) {
    const stemsGrid = document.getElementById('stemsGrid');
    stemsGrid.innerHTML = '';
    
    stems.forEach(stem => {
        const stemCard = createStemCard(stem, jobId);
        stemsGrid.appendChild(stemCard);
    });
}

/**
 * Create stem card
 */
function createStemCard(stem, jobId) {
    const card = document.createElement('div');
    card.className = `stem-card ${stem.name}`;
    
    // Get stem icon
    const stemIcon = getStemIcon(stem.name);
    
    card.innerHTML = `
        <div class="stem-header">
            <h3 class="stem-name">${stem.name}</h3>
            <div class="stem-icon" style="background: ${getStemGradient(stem.name)}">
                <i class="${stemIcon}"></i>
            </div>
        </div>
        
        <div class="stem-waveform">
            <div class="waveform-placeholder">Audio Waveform</div>
        </div>
        
        <div class="stem-controls">
            <button class="btn btn-primary btn-sm" onclick="playAudio('${jobId}', '${stem.name}')">
                <i class="fas fa-play"></i>
                Play
            </button>
            <button class="btn btn-secondary btn-sm" onclick="downloadStem('${jobId}', '${stem.name}')">
                <i class="fas fa-download"></i>
                Download
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Get stem icon
 */
function getStemIcon(stemName) {
    const icons = {
        'vocals': 'fas fa-microphone',
        'drums': 'fas fa-drum',
        'bass': 'fas fa-guitar',
        'other': 'fas fa-music',
        'piano': 'fas fa-piano',
        'guitar': 'fas fa-guitar'
    };
    
    return icons[stemName] || 'fas fa-music';
}

/**
 * Get stem gradient
 */
function getStemGradient(stemName) {
    const gradients = {
        'vocals': 'linear-gradient(90deg, #f093fb, #f5576c)',
        'drums': 'linear-gradient(90deg, #4facfe, #00f2fe)',
        'bass': 'linear-gradient(90deg, #43e97b, #38f9d7)',
        'other': 'linear-gradient(90deg, #fa709a, #fee140)',
        'piano': 'linear-gradient(90deg, #a8edea, #fed6e3)',
        'guitar': 'linear-gradient(90deg, #ff9a9e, #fecfef)'
    };
    
    return gradients[stemName] || 'linear-gradient(90deg, #667eea, #764ba2)';
}

/**
 * Play audio in modal
 */
function playAudio(jobId, stemName) {
    const modal = document.getElementById('audioModal');
    const audioPlayer = document.getElementById('audioPlayer');
    const modalTitle = document.getElementById('modalTitle');
    
    // Set audio source
    audioPlayer.src = `/api/download/${jobId}/${stemName}`;
    modalTitle.textContent = `Playing: ${stemName.charAt(0).toUpperCase() + stemName.slice(1)}`;
    
    // Show modal
    modal.classList.add('active');
    
    // Auto play
    audioPlayer.load();
    audioPlayer.play().catch(e => {
        console.log('Auto-play prevented by browser:', e);
        showNotification('Click play button to start audio', 'info');
    });
}

/**
 * Close audio modal
 */
function closeAudioModal() {
    const modal = document.getElementById('audioModal');
    const audioPlayer = document.getElementById('audioPlayer');
    
    modal.classList.remove('active');
    audioPlayer.pause();
    audioPlayer.src = '';
}

/**
 * Download stem
 */
function downloadStem(jobId, stemName) {
    const downloadUrl = `/api/download/${jobId}/${stemName}`;
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${stemName}.wav`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Downloading ${stemName} stem...`, 'success');
}

/**
 * Reset app to upload state
 */
function resetApp() {
    // Reset variables
    currentJobId = null;
    isProcessing = false;
    
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    // Reset UI
    resetToUploadState();
    
    // Clear file input
    document.getElementById('audioFile').value = '';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Update all stem progress at once
 */
function updateAllStemProgress(progress, status) {
    Object.keys(stemProgress).forEach(stemName => {
        updateStemProgress(stemName, progress, status);
    });
}

/**
 * Simulate individual stem progress during separation
 */
function simulateStemProgress(overallProgress) {
    // Map overall progress (30-70%) to individual stem progress
    const separationStart = 30;
    const separationEnd = 70;
    
    if (overallProgress < separationStart) {
        updateAllStemProgress(0, 'waiting');
        return;
    }
    
    if (overallProgress > separationEnd) {
        updateAllStemProgress(100, 'completed');
        return;
    }
    
    // Calculate individual stem progress with some variation
    const separationProgress = ((overallProgress - separationStart) / (separationEnd - separationStart)) * 100;
    
    Object.keys(stemProgress).forEach((stemName, index) => {
        // Add some variation so stems complete at slightly different times
        const variation = (index * 5) - 10; // -10 to +15 variation
        const stemProgress = Math.max(0, Math.min(100, separationProgress + variation));
        
        const status = stemProgress >= 100 ? 'completed' : 'processing';
        updateStemProgress(stemName, stemProgress, status);
    });
}

/**
 * Reset to upload state
 */
function resetToUploadState() {
    // Show upload section
    document.getElementById('uploadSection').style.display = 'block';
    
    // Hide other sections
    document.getElementById('processingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('stemProgressSection').style.display = 'none';
    
    // Reset progress
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    
    // Reset stem progress
    stemProgress = {};
    
    // Clear directory input
    document.getElementById('outputDirectory').value = '';
    
    // Update state
    isProcessing = false;
}

/**
 * Update processing status
 */
function updateProcessingStatus(message, progress = 0) {
    document.getElementById('processingStatus').textContent = message;
    document.getElementById('statusText').textContent = message;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${progress}%`;
}

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 300px;
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(20px);
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
    
    // Add animation styles if they don't exist
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 0.25rem;
                opacity: 0.7;
                transition: opacity 0.15s;
            }
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(styles);
    }
}

/**
 * Get notification icon
 */
function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Get notification color
 */
function getNotificationColor(type) {
    const colors = {
        'success': 'linear-gradient(135deg, #10b981, #047857)',
        'error': 'linear-gradient(135deg, #ef4444, #dc2626)',
        'warning': 'linear-gradient(135deg, #f59e0b, #d97706)',
        'info': 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };
    return colors[type] || colors.info;
}

/**
 * Handle processing errors
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('An unexpected error occurred. Please try again.', 'error');
    
    if (isProcessing) {
        resetToUploadState();
    }
});

/**
 * Handle network errors
 */
window.addEventListener('offline', function() {
    showNotification('You are offline. Please check your internet connection.', 'warning');
});

window.addEventListener('online', function() {
    showNotification('You are back online!', 'success');
});

// Export functions for global access
window.playAudio = playAudio;
window.closeAudioModal = closeAudioModal;
window.downloadStem = downloadStem;
window.resetApp = resetApp;
window.selectDirectory = selectDirectory;
