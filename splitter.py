import argparse
import os
import torch
import torchaudio
from demucs.apply import apply_model
from demucs.pretrained import get_model
from demucs.audio import AudioFile

def split_stems(input_path, output_dir, model_name='htdemucs'):
    """
    Splits an audio file into stems using Demucs.

    Args:
        input_path (str): Path to the input audio file.
        output_dir (str): Directory to save the output stems.
        model_name (str): Demucs model to use ('htdemucs' for high-quality 4-stem separation).
    """
    # Load the pre-trained model
    model = get_model(name=model_name)

    # Move model to GPU if available, else CPU
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)

    # Load the audio
    try:
        wav = AudioFile(input_path).read()
        print(f"Loaded audio shape: {wav.shape}")
    except Exception as e:
        raise ValueError(f"Failed to load audio from {input_path}: {str(e)}")

    # Ensure wav is 2D: (channels, length)
    if wav.dim() == 3:
        if wav.shape[0] == 1:
            wav = wav.squeeze(0)  # Remove leading dimension if present
        else:
            raise ValueError(f"Unexpected audio shape: {wav.shape}. Expected (channels, length).")
    elif wav.dim() != 2:
        raise ValueError(f"Audio must be 2D (channels, length), got shape: {wav.shape}")

    # Add batch dimension: (1, channels, length)
    mix = wav.unsqueeze(0)
    print(f"Input to model shape: {mix.shape}")

    # Apply the model to separate sources
    try:
        sources = apply_model(model, mix, device=device, progress=True)
    except Exception as e:
        raise RuntimeError(f"Error during model inference: {str(e)}")

    # Create output directory if it doesn't exist
    try:
        os.makedirs(output_dir, exist_ok=True)
    except Exception as e:
        raise RuntimeError(f"Failed to create output directory {output_dir}: {str(e)}")

    # Check torchaudio backend
    backends = torchaudio.list_audio_backends()
    print(f"Available torchaudio backends: {backends}")
    if not backends:
        raise RuntimeError("No torchaudio backends available. Install FFmpeg or libsndfile.")

    # Save each stem as a WAV file
    stem_names = model.sources  # e.g., ['drums', 'bass', 'other', 'vocals']
    for i, stem in enumerate(stem_names):
        source = sources[0][i]  # Extract the stem
        output_path = os.path.join(output_dir, f"{stem}.wav")
        try:
            # Use torchaudio.save directly for better control
            torchaudio.save(output_path, source, sample_rate=model.samplerate, format="wav")
            print(f"Saved {stem} to {output_path}")
        except Exception as e:
            raise RuntimeError(f"Failed to save {output_path}: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Split audio into stems using Demucs.")
    parser.add_argument("input_path", type=str, help="Path to the input audio file.")
    parser.add_argument("output_dir", type=str, help="Directory to save the output stems.")
    parser.add_argument("--model", type=str, default="htdemucs", help="Demucs model name (e.g., 'htdemucs' for 4 stems, 'htdemucs_6s' for 6 stems).")

    args = parser.parse_args()
    split_stems(args.input_path, args.output_dir, args.model)
