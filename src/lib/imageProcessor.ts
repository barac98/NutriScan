/**
 * Preprocessing and image quality optimization utility.
 * Applies resizing, contrast enhancement, and optional 3x3 sharpening convolution filters.
 * Computes a sharpness score to warn the user if the image is too blurry.
 */

interface EnhanceResult {
  base64: string;          // Extracted clean image data (JPEG)
  isBlurry: boolean;       // True if below acceptable sharpness threshold
  sharpnessScore: number;  // Calculated edge variance
}

/**
 * Reads a File and loads it into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Performs high-contrast and continuous sharpening convolution on raw image pixels.
 * Uses a standard Laplacian-edge-sharpen kernel:
 * [  0, -0.5,  0 ]
 * [ -0.5,  3.0, -0.5 ]
 * [  0, -0.5,  0 ]
 */
function applySharpenAndContrastFilter(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number
): { sharpnessScore: number } {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    const len = pixels.length;

    // First step: contrast stretch / normalization to aid OCR
    let minLuma = 255;
    let maxLuma = 0;
    
    // Sample a subset of pixels to estimate luminance bounds quickly
    const sampleStep = Math.max(1, Math.floor(len / 4000));
    for (let i = 0; i < len; i += 4 * sampleStep) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma < minLuma) minLuma = luma;
      if (luma > maxLuma) maxLuma = luma;
    }

    // Dynamic contrast stretching if dynamic range is cramped
    if (maxLuma - minLuma > 30 && maxLuma - minLuma < 220) {
      const range = maxLuma - minLuma;
      for (let i = 0; i < len; i += 4) {
        pixels[i]     = Math.min(255, Math.max(0, ((pixels[i] - minLuma) / range) * 255));
        pixels[i + 1] = Math.min(255, Math.max(0, ((pixels[i + 1] - minLuma) / range) * 255));
        pixels[i + 2] = Math.min(255, Math.max(0, ((pixels[i + 2] - minLuma) / range) * 255));
      }
    }

    // Convolution sharpen parameters
    const output = ctx.createImageData(width, height);
    const outPixels = output.data;
    
    // Kernel:
    // [  0, -0.3,  0 ]
    // [ -0.3,  2.2, -0.3 ]
    // [  0, -0.3,  0 ]
    const kVal = 0.3;
    const center = 1 + (4 * kVal);

    let edgeDiffSum = 0;
    let edgeDiffCount = 0;

    // Loop through pixels excluding boundaries
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate average absolute color variance with immediate neighbors for sharpness metric
        const leftVal = ((y * width + (x - 1)) * 4);
        const rightVal = ((y * width + (x + 1)) * 4);
        const topVal = (((y - 1) * width + x) * 4);
        const bottomVal = (((y + 1) * width + x) * 4);
        
        const lumaCenter = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
        const lumaLeft = 0.299 * pixels[leftVal] + 0.587 * pixels[leftVal + 1] + 0.114 * pixels[leftVal + 2];
        
        edgeDiffSum += Math.abs(lumaCenter - lumaLeft);
        edgeDiffCount++;

        // Apply 3x3 sharpen filter for each channel
        for (let c = 0; c < 3; c++) {
          const val = pixels[idx + c] * center -
            (pixels[leftVal + c] + pixels[rightVal + c] + pixels[topVal + c] + pixels[bottomVal + c]) * kVal;
          outPixels[idx + c] = Math.min(255, Math.max(0, val));
        }
        // Alpha channel
        outPixels[idx + 3] = pixels[idx + 3];
      }
    }

    // Fill output back to canvas
    ctx.putImageData(output, 0, 0);

    const sharpnessScore = edgeDiffCount > 0 ? (edgeDiffSum / edgeDiffCount) : 0;
    return { sharpnessScore };
  } catch (error) {
    console.warn("Canvas image processing failed, falling back safely:", error);
    return { sharpnessScore: 15 }; // Default to moderate score on failure
  }
}

/**
 * Main entry function to enhance, resize, and detect blur.
 * @param file The uploaded or captured file object
 * @param maxDimension Downscales if width or height exceeds this limit (default 1200 px)
 */
export async function processAndEnhanceImage(
  file: File, 
  maxDimension = 1200
): Promise<EnhanceResult> {
  try {
    const img = await loadImage(file);
    
    // Create offscreen canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create 2D context on offscreen canvas");
    }

    // Calculate dimensions with aspect ratio constraints
    let width = img.width;
    let height = img.height;
    
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;
    
    // Draw initial image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Enhance contrast and apply sharpening convolution filter
    const { sharpnessScore } = applySharpenAndContrastFilter(ctx, width, height);

    // Get optimized base64 string directly in JPEG format
    const base64String = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = base64String.split(",")[1];

    // Threshold under which images are considered blurry.
    // Sharp images typically score > 6, blurry or uniform textures < 3.2.
    const isBlurry = sharpnessScore < 3.2;

    return {
      base64,
      isBlurry,
      sharpnessScore
    };
  } catch (err) {
    console.error("Failed to enhance image. Returning clean raw base64 instead.", err);
    // Safe standard fallback: read directly as base64 without filtering
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = (reader.result as string).split(",")[1];
        resolve({
          base64: rawBase64,
          isBlurry: false,
          sharpnessScore: 10
        });
      };
      reader.onerror = () => reject(err);
      reader.readAsDataURL(file);
    });
  }
}
