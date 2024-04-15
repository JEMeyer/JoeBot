export interface Options {
  numa: boolean;
  num_ctx: number;
  num_batch: number;
  main_gpu: number;
  low_vram: boolean;
  f16_kv: boolean;
  logits_all: boolean;
  vocab_only: boolean;
  use_mmap: boolean;
  use_mlock: boolean;
  embedding_only: boolean;
  num_thread: number;
  num_keep: number;
  seed: number;
  num_predict: number;
  top_k: number;
  top_p: number;
  tfs_z: number;
  typical_p: number;
  repeat_last_n: number;
  temperature: number;
  repeat_penalty: number;
  presence_penalty: number;
  frequency_penalty: number;
  mirostat: number;
  mirostat_tau: number;
  mirostat_eta: number;
  penalize_newline: boolean;
  stop: string[];
}
export interface GenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: string;
  images?: Uint8Array[] | string[];
  keep_alive?: string | number;
  options?: Partial<Options>;
}
export interface Message {
  role: string;
  content: string;
  images?: Uint8Array[] | string[];
}
export interface ChatRequest {
  model: string;
  messages?: Message[];
  stream?: boolean;
  format?: string;
  keep_alive?: string | number;
  options?: Partial<Options>;
}
