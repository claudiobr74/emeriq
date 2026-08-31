/**
 * Buffer circular efêmero de PCM. Não persiste; só cobre reconexão/fallback.
 */
export class PcmRingBuffer {
  private chunks: Float32Array[] = [];
  private samples = 0;
  private sourceRate = 0;

  constructor(private readonly maxSamples: number) {}

  push(frame: Float32Array, sourceRate: number): void {
    if (frame.length === 0) return;
    this.sourceRate = sourceRate;
    const copy = new Float32Array(frame);
    this.chunks.push(copy);
    this.samples += copy.length;
    while (this.samples > this.maxSamples && this.chunks.length > 0) {
      const overflow = this.samples - this.maxSamples;
      const first = this.chunks[0]!;
      if (first.length <= overflow) {
        this.chunks.shift();
        this.samples -= first.length;
      } else {
        this.chunks[0] = first.subarray(overflow);
        this.samples -= overflow;
      }
    }
  }

  get sampleRate(): number {
    return this.sourceRate;
  }

  get length(): number {
    return this.samples;
  }

  drain(): { samples: Float32Array; sampleRate: number } {
    const samples = new Float32Array(Math.max(0, this.samples));
    let offset = 0;
    for (const chunk of this.chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }
    const sampleRate = this.sourceRate;
    this.clear();
    return { samples, sampleRate };
  }

  clear(): void {
    this.chunks = [];
    this.samples = 0;
  }
}
