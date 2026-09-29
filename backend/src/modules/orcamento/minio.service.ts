import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Client } from 'minio';
import * as crypto from 'crypto';

// Armazena receitas e anexos no bucket privado do MinIO; o acesso é sempre por
// link assinado e temporário
@Injectable()
export class MinioService {
  private minioClient: Client;
  // Cliente usado só para assinar links: precisa do host que o NAVEGADOR enxerga.
  // Dentro do Docker o backend fala com "minio:9000", que o navegador não resolve.
  private linkClient: Client;
  private bucketName = 'receitas';
  private readonly logger = new Logger(MinioService.name);

  constructor() {
    this.minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: false,
      accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    });

    // Com a região fixa, a assinatura é calculada localmente, sem chamar o host público
    this.linkClient = new Client({
      endPoint:
        process.env.MINIO_PUBLIC_ENDPOINT ||
        process.env.MINIO_ENDPOINT ||
        'localhost',
      port: parseInt(
        process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || '9000',
        10,
      ),
      useSSL: process.env.MINIO_PUBLIC_SSL === 'true',
      accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
      region: 'us-east-1',
    });

    void this.inicializarBucket();
  }

  private async inicializarBucket() {
    try {
      const existe = await this.minioClient.bucketExists(this.bucketName);
      if (!existe) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(
          `Bucket '${this.bucketName}' criado com sucesso no MinIO.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao verificar/criar o bucket '${this.bucketName}'`,
        error,
      );
    }
  }

  // Registros antigos têm a URL completa; novos terão apenas a chave.
  private extrairObjectKey(valor: string): string {
    if (valor.startsWith('http')) {
      return valor.split('/').pop() ?? valor;
    }
    return valor;
  }

  async uploadArquivo(
    nomeArquivo: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    const hash = crypto.randomBytes(8).toString('hex');
    const nomeUnico = `${hash}-${nomeArquivo.replace(/\s+/g, '_')}`;

    try {
      await this.minioClient.putObject(
        this.bucketName,
        nomeUnico,
        buffer,
        buffer.length,
        { 'Content-Type': mimetype },
      );
      this.logger.log(`Upload concluído: ${nomeUnico}`);
      // Salva apenas a chave — a URL pré-assinada é gerada em tempo de leitura
      return nomeUnico;
    } catch (error) {
      this.logger.error(`Erro ao fazer upload do arquivo ${nomeUnico}`, error);
      throw new ServiceUnavailableException(
        'Não foi possível salvar o arquivo agora. Tente novamente em instantes.',
      );
    }
  }

  async gerarUrlAssinada(objectKey: string): Promise<string> {
    const chave = this.extrairObjectKey(objectKey);
    try {
      // expiry = 3600 segundos (1 hora)
      return await this.linkClient.presignedGetObject(
        this.bucketName,
        chave,
        3600,
      );
    } catch (error) {
      this.logger.error(`Erro ao gerar URL pré-assinada para ${chave}`, error);
      throw new ServiceUnavailableException(
        'Não foi possível gerar o link de acesso ao arquivo.',
      );
    }
  }

  async baixarArquivo(
    objectKey: string,
  ): Promise<{ buffer: Buffer; mimetype: string }> {
    const chave = this.extrairObjectKey(objectKey);
    try {
      const [stat, stream] = await Promise.all([
        this.minioClient.statObject(this.bucketName, chave),
        this.minioClient.getObject(this.bucketName, chave),
      ]);
      const partes: Buffer[] = [];
      for await (const parte of stream) partes.push(Buffer.from(parte));
      return {
        buffer: Buffer.concat(partes),
        mimetype: stat.metaData?.['content-type'] ?? 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Erro ao baixar o arquivo ${chave}`, error);
      throw new ServiceUnavailableException(
        'Não foi possível ler o arquivo no armazenamento.',
      );
    }
  }
}
