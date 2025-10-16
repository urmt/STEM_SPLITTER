# 🎵 Professional AI Stem Splitter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red.svg)](https://pytorch.org/)

A **professional-quality, AI-powered audio stem separation web application** with a beautiful and functional UI inspired by industry leaders like LALAL.AI, Moises.ai, and Soundverse Splitter.

**Break songs into their individual tracks** with studio-quality precision using state-of-the-art AI models.

![Stem Splitter Demo](https://via.placeholder.com/800x400/667eea/ffffff?text=Professional+Stem+Splitter+UI)

## 🚀 Key Features

✨ **Individual Stem Progress Bars** - Watch each stem (vocals, drums, bass, other) separate in real-time  
📁 **Custom Output Directories** - Choose exactly where you want your stems saved  
🎨 **Professional UI/UX** - Clean, modern interface inspired by LALAL.AI and Moises.ai  
🎵 **Color-Coded Stems** - Each stem type has its own visual identity and gradient  
⚡ **Real-Time Processing** - Live progress updates with detailed status information  
🚓 **Drag & Drop Upload** - Intuitive file upload with visual feedback  
📱 **Mobile Responsive** - Works perfectly on desktop, tablet, and mobile devices  
🎬 **Audio Preview** - Built-in audio player for each separated stem  
🔊 **Multiple Formats** - Support for MP3, WAV, FLAC, M4A, AAC, OGG files  
🤖 **AI-Powered** - Uses Meta's state-of-the-art Demucs models  

## ✨ Detailed Features

### 🚀 Professional Quality
- **State-of-the-art AI Models**: Uses Demucs (Meta's research) for industry-leading stem separation quality
- **Multiple Model Options**: HTDemucs (4-stem), HTDemucs Fine-tuned, and HTDemucs 6-stem
- **High-Quality Output**: Professional WAV format output with original sample rates

### 🎨 Beautiful UI/UX
- **Modern Design**: Inspired by LALAL.AI's minimalist approach and Moises.ai's interactive features
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Real-time Progress**: Live progress tracking with detailed status updates
- **Color-coded Stems**: Each stem type has its own gradient and visual identity

### 🔧 Advanced Features
- **Drag & Drop Upload**: Intuitive file upload with visual feedback
- **Audio Preview**: Built-in audio player for each separated stem
- **Batch Processing**: Queue multiple files for processing
- **Format Support**: MP3, WAV, FLAC, M4A, AAC, OGG input formats
- **Smart Notifications**: Real-time feedback with beautiful animations

### ⚡ Performance
- **GPU Acceleration**: Automatic CUDA detection for faster processing
- **Model Caching**: Smart model loading to reduce processing time
- **Background Processing**: Non-blocking processing with real-time updates
- **Memory Optimization**: Efficient handling of large audio files

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- FFmpeg (for audio processing)
- At least 4GB RAM (8GB recommended)
- Optional: CUDA-compatible GPU for faster processing

### Installation

1. **Clone or download the project:**
   ```bash
   cd /home/student/STEM-SPLITTER
   ```

2. **Install FFmpeg:**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # CentOS/RHEL/Fedora
   sudo dnf install ffmpeg
   
   # macOS
   brew install ffmpeg
   ```

3. **Create a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the application:**
   ```bash
   python app.py
   ```

6. **Open your browser:**
   Navigate to `http://localhost:5000`

## 🎯 Usage Guide

### Basic Usage
1. **Select AI Model**: Choose from HTDemucs options (4-stem recommended for most users)
2. **Upload Audio**: Drag & drop or click to select your audio file
3. **Wait for Processing**: Watch real-time progress with detailed status updates
4. **Download Results**: Play preview and download individual stems

### Supported File Formats
- **Input**: MP3, WAV, FLAC, M4A, AAC, OGG (up to 500MB)
- **Output**: High-quality WAV files

### Model Descriptions
- **HTDemucs (Recommended)**: High-quality 4-stem separation (vocals, drums, bass, other)
- **HTDemucs Fine-tuned**: Optimized version with improved quality
- **HTDemucs 6-stem**: Advanced separation (vocals, drums, bass, piano, guitar, other)

## 🏗️ Technical Architecture

### Backend (Flask)
- **RESTful API**: Clean API design for upload, status, and download endpoints
- **Background Processing**: Threaded processing to maintain responsiveness
- **Job Management**: UUID-based job tracking with progress monitoring
- **Error Handling**: Comprehensive error handling with detailed logging

### Frontend (HTML/CSS/JS)
- **Progressive Web App**: Modern web standards with offline support
- **Real-time Updates**: WebSocket-style polling for live progress
- **Responsive Design**: Mobile-first design with desktop enhancements
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation

### AI Processing
- **Demucs Integration**: Direct integration with Facebook's Demucs models
- **GPU Optimization**: Automatic CUDA detection and memory management
- **Model Caching**: Intelligent model loading to reduce startup time
- **Progress Tracking**: Detailed progress reporting throughout the pipeline

## 📁 Project Structure

```
STEM-SPLITTER/
├── app.py                 # Main Flask application
├── splitter.py           # Original CLI version
├── requirements.txt      # Python dependencies
├── README.md            # This file
├── templates/
│   └── index.html       # Main web interface
├── static/
│   ├── style.css        # Professional styling
│   ├── script.js        # Interactive JavaScript
│   └── outputs/         # Processed stems (auto-created)
└── stems/               # CLI output directory
```

## ⚙️ Configuration Options

### Environment Variables
Create a `.env` file for custom configuration:
```bash
# Server Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
HOST=0.0.0.0

# Processing Options
MAX_FILE_SIZE=524288000  # 500MB
DEFAULT_MODEL=htdemucs
CUDA_DEVICE=0

# Storage
OUTPUT_DIR=static/outputs
TEMP_DIR=/tmp/stem_splitter
```

### Model Selection
Choose the best model for your needs:
- **Speed Priority**: Use HTDemucs (4-stem)
- **Quality Priority**: Use HTDemucs Fine-tuned
- **Advanced Separation**: Use HTDemucs 6-stem (longer processing time)

## 🔧 Advanced Usage

### GPU Acceleration
For faster processing with NVIDIA GPUs:
1. Install CUDA toolkit (11.7 or 11.8)
2. Install PyTorch with CUDA support:
   ```bash
   pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

### Production Deployment
For production use with Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker Deployment
Create a `Dockerfile` for containerized deployment:
```dockerfile
FROM python:3.9
RUN apt-get update && apt-get install -y ffmpeg
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

## 🐛 Troubleshooting

### Common Issues

**1. FFmpeg not found**
```bash
# Ubuntu/Debian
sudo apt install ffmpeg
# Or add to PATH if installed elsewhere
```

**2. CUDA out of memory**
- Reduce file size or use CPU processing
- Close other GPU-intensive applications
- Set `CUDA_VISIBLE_DEVICES=""` to force CPU

**3. Model download fails**
- Check internet connection
- Models are downloaded automatically on first use
- Clear cache: `rm -rf ~/.cache/torch/hub/checkpoints/`

**4. Upload fails**
- Check file size (<500MB)
- Verify file format is supported
- Ensure sufficient disk space

### Performance Tips
- Use WAV or FLAC input for best quality
- Enable GPU acceleration for 3-5x speed improvement
- Process shorter files (<10 minutes) for faster results
- Close other applications to free up memory

## 🤝 Contributing

We welcome contributions! Please feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Meta Research**: For the incredible Demucs models
- **LALAL.AI**: UI/UX inspiration for clean, professional design
- **Moises.ai**: Interactive features and color-coded stem visualization
- **PyTorch Team**: For the deep learning framework
- **Flask Community**: For the lightweight web framework

## 📞 Support

For questions, issues, or feature requests:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the model documentation at [Demucs GitHub](https://github.com/facebookresearch/demucs)

---

**Professional Stem Splitter** - Bringing studio-quality audio separation to everyone! 🎵✨
