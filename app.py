"""
Professional Stem Splitter Web Application
A Flask-based web interface for AI-powered audio stem separation
"""

import os
import json
import uuid
import threading
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
import torch
import torchaudio
from demucs.apply import apply_model
from demucs.pretrained import get_model
from demucs.audio import AudioFile
import tempfile
import shutil
import logging

# Configure logging for better debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

# Global variables for processing state
processing_jobs = {}
model_cache = {}

class StemSplitter:
    """Professional stem splitter class with advanced features"""
    
    def __init__(self, model_name='htdemucs'):
        self.model_name = model_name
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
    def load_model(self):
        """Load the Demucs model with caching"""
        if self.model_name not in model_cache:
            logger.info(f"Loading model: {self.model_name}")
            model = get_model(name=self.model_name)
            model.to(self.device)
            model_cache[self.model_name] = model
            logger.info("Model loaded successfully")
        return model_cache[self.model_name]
    
    def process_audio(self, input_path, output_dir, job_id):
        """Process audio file with progress tracking"""
        try:
            # Update job status
            processing_jobs[job_id]['status'] = 'loading_model'
            processing_jobs[job_id]['progress'] = 10
            
            model = self.load_model()
            
            # Update job status
            processing_jobs[job_id]['status'] = 'loading_audio'
            processing_jobs[job_id]['progress'] = 20
            
            # Load audio file
            wav = AudioFile(input_path).read()
            logger.info(f"Loaded audio shape: {wav.shape}")
            
            # Ensure proper audio format
            if wav.dim() == 3 and wav.shape[0] == 1:
                wav = wav.squeeze(0)
            elif wav.dim() != 2:
                raise ValueError(f"Audio must be 2D, got shape: {wav.shape}")
            
            # Add batch dimension
            mix = wav.unsqueeze(0)
            
            # Update job status
            processing_jobs[job_id]['status'] = 'separating_stems'
            processing_jobs[job_id]['progress'] = 30
            
            # Apply model for stem separation
            sources = apply_model(model, mix, device=self.device, progress=True)
            
            # Update job status
            processing_jobs[job_id]['status'] = 'saving_stems'
            processing_jobs[job_id]['progress'] = 70
            
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            # Save stems
            stem_names = model.sources
            stem_files = []
            
            for i, stem_name in enumerate(stem_names):
                source = sources[0][i]
                output_path = os.path.join(output_dir, f"{stem_name}.wav")
                
                # Save with error handling using soundfile backend
                try:
                    torchaudio.save(output_path, source, sample_rate=model.samplerate)
                except Exception as save_error:
                    # Fallback: save using numpy and soundfile
                    import soundfile as sf
                    source_np = source.detach().cpu().numpy()
                    sf.write(output_path, source_np.T, model.samplerate)
                
                stem_files.append({
                    'name': stem_name,
                    'file': f"{stem_name}.wav",
                    'path': output_path
                })
                
                logger.info(f"Saved {stem_name} to {output_path}")
            
            # Update job completion
            processing_jobs[job_id]['status'] = 'completed'
            processing_jobs[job_id]['progress'] = 100
            processing_jobs[job_id]['stems'] = stem_files
            processing_jobs[job_id]['completed_at'] = datetime.now().isoformat()
            
            logger.info(f"Job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {str(e)}")
            processing_jobs[job_id]['status'] = 'error'
            processing_jobs[job_id]['error'] = str(e)

@app.route('/')
def index():
    """Main page with the stem splitter interface"""
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and start processing"""
    try:
        if 'audio_file' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            return jsonify({'error': f'Unsupported file type: {file_ext}'}), 400
        
        # Get model selection and output directory from request FIRST
        model_name = request.form.get('model', 'htdemucs')
        custom_output_dir = request.form.get('output_directory', '').strip()
        
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Create temporary directories
        temp_dir = tempfile.mkdtemp()
        input_path = os.path.join(temp_dir, f"input{file_ext}")
        
        # Use custom output directory if provided, otherwise use default
        if custom_output_dir and os.path.isdir(custom_output_dir):
            output_dir = os.path.join(custom_output_dir, f"stems_{job_id}")
            use_custom_dir = True
        else:
            output_dir = os.path.join(app.root_path, 'static', 'outputs', job_id)
            use_custom_dir = False
        
        # Save uploaded file
        file.save(input_path)
        
        # Initialize job tracking
        processing_jobs[job_id] = {
            'id': job_id,
            'filename': file.filename,
            'model': model_name,
            'status': 'queued',
            'progress': 0,
            'created_at': datetime.now().isoformat(),
            'temp_dir': temp_dir,
            'input_path': input_path,
            'output_dir': output_dir,
            'use_custom_dir': use_custom_dir,
            'custom_output_dir': custom_output_dir if use_custom_dir else None
        }
        
        # Start processing in background thread
        splitter = StemSplitter(model_name)
        thread = threading.Thread(
            target=splitter.process_audio,
            args=(input_path, output_dir, job_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'job_id': job_id,
            'status': 'queued',
            'message': 'File uploaded successfully, processing started'
        })
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/status/<job_id>')
def job_status(job_id):
    """Get processing status for a job"""
    if job_id not in processing_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = processing_jobs[job_id]
    
    # Clean up temporary files after completion
    if job['status'] in ['completed', 'error'] and 'temp_dir' in job:
        try:
            shutil.rmtree(job['temp_dir'], ignore_errors=True)
            job.pop('temp_dir', None)
            job.pop('input_path', None)
        except:
            pass
    
    return jsonify(job)

@app.route('/api/download/<job_id>/<stem_name>')
def download_stem(job_id, stem_name):
    """Download individual stem file"""
    if job_id not in processing_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = processing_jobs[job_id]
    if job['status'] != 'completed':
        return jsonify({'error': 'Job not completed'}), 400
    
    # Find the requested stem
    stem_file = None
    for stem in job.get('stems', []):
        if stem['name'] == stem_name:
            stem_file = stem['file']
            break
    
    if not stem_file:
        return jsonify({'error': 'Stem not found'}), 404
    
    try:
        return send_from_directory(
            job['output_dir'],
            stem_file,
            as_attachment=True,
            download_name=f"{job['filename']}_{stem_name}.wav"
        )
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({'error': 'File not found'}), 404

@app.route('/api/models')
def available_models():
    """Get list of available Demucs models"""
    models = [
        {
            'name': 'htdemucs',
            'description': 'High-quality 4-stem separation (vocals, drums, bass, other)',
            'stems': 4,
            'recommended': True
        },
        {
            'name': 'htdemucs_ft',
            'description': 'Fine-tuned version with improved quality',
            'stems': 4,
            'recommended': False
        },
        {
            'name': 'htdemucs_6s',
            'description': '6-stem separation (vocals, drums, bass, piano, guitar, other)',
            'stems': 6,
            'recommended': False
        }
    ]
    return jsonify(models)

@app.route('/static/outputs/<path:filename>')
def serve_output(filename):
    """Serve output files"""
    return send_from_directory(os.path.join(app.root_path, 'static', 'outputs'), filename)

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('static/outputs', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    print("🎵 Professional Stem Splitter Starting Up...")
    print("📊 Loading AI models (this may take a moment)...")
    print("🌐 Server will be available at: http://localhost:8080")
    print("✨ Features: Drag & Drop Upload, Real-time Progress, Professional UI")
    
    app.run(debug=True, host='127.0.0.1', port=8080, threaded=True)
