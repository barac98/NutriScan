/**
 * Mobile Haptic & Audio Feedback Engine
 * Provides short, synthesized physical vibration and audio feedback for an organic, native-app feel.
 */

class HapticEngine {
  private audioCtx: AudioContext | null = null;

  private initAudio() {
    if (!this.audioCtx) {
      // Lazy load to prevent browser warning about autoplay
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    // Resume if suspended by browser security
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  /**
   * Triggers a native mechanical tap vibration (15ms to 30ms)
   */
  vibrate(duration: number | number[]) {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(duration);
      } catch (e) {
        // Safe to ignore if permissions/iframes block it
      }
    }
  }

  /**
   * Play clean, synthesized sine-wave audio feedback.
   */
  private playTone(frequencies: number[], duration: number, type: OscillatorType = "sine", volume = 0.05) {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.type = type;
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      // Volume envelope (prevent pop sounds by fading out)
      const now = this.audioCtx.currentTime;
      gainNode.gain.setValueAtTime(volume, now);
      
      if (frequencies.length === 1) {
        osc.frequency.setValueAtTime(frequencies[0], now);
      } else if (frequencies.length > 1) {
        // frequency sweep / arpeggio
        osc.frequency.setValueAtTime(frequencies[0], now);
        const step = duration / frequencies.length;
        frequencies.forEach((freq, idx) => {
          osc.frequency.setValueAtTime(freq, now + (idx * step));
        });
      }

      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (err) {
      // Safe fallback if audio is blocked or fails
    }
  }

  /**
   * Soft click / checkmark selection (low tone, ultra short)
   */
  playSelect() {
    this.vibrate(12);
    this.playTone([240, 320], 0.06, "sine", 0.08);
  }

  /**
   * Action button click (medium click)
   */
  playClick() {
    this.vibrate(18);
    this.playTone([400], 0.04, "sine", 0.05);
  }

  /**
   * Scanning successful (optimistic dual sweep beep)
   */
  playScanSuccess() {
    this.vibrate([15, 30, 20]);
    this.playTone([600, 900, 1200], 0.15, "triangle", 0.04);
  }

  /**
   * Error or image blurry warning (double pulse)
   */
  playWarning() {
    this.vibrate([40, 60, 40]);
    this.playTone([180, 150], 0.22, "sawtooth", 0.04);
  }
}

export const haptics = new HapticEngine();
