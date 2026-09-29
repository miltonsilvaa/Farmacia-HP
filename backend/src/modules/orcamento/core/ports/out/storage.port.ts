export interface StoragePort {
  uploadArquivo(nomeArquivo: string, buffer: Buffer, mimetype: string): Promise<string>;
  gerarUrlAssinada(objectKey: string): Promise<string>;
  baixarArquivo(objectKey: string): Promise<{ buffer: Buffer; mimetype: string }>;
}

export const STORAGE_PORT = Symbol('STORAGE_PORT');
