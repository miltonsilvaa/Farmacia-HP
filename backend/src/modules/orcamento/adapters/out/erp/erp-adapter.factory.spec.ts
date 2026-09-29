import { escolherErpAdapter } from './erp-adapter.factory';
import { ErpHttpAdapter } from './erp-http.adapter';
import { ErpArquivoAdapter } from './erp-arquivo.adapter';
import { ErpMockAdapter } from './erp-mock.adapter';

describe('escolherErpAdapter', () => {
  it('usa o modo informado em ERP_MODO', () => {
    expect(escolherErpAdapter({ ERP_MODO: 'mock' })).toBe(ErpMockAdapter);
    expect(escolherErpAdapter({ ERP_MODO: 'arquivo' })).toBe(ErpArquivoAdapter);
    expect(
      escolherErpAdapter({ ERP_MODO: 'http', ERP_URL: 'http://erp' }),
    ).toBe(ErpHttpAdapter);
  });

  it('aceita maiúsculas e espaços', () => {
    expect(escolherErpAdapter({ ERP_MODO: ' MOCK ' })).toBe(ErpMockAdapter);
  });

  it('sem ERP_MODO mantém o comportamento antigo (ERP_URL decide)', () => {
    expect(escolherErpAdapter({ ERP_URL: 'http://erp' })).toBe(ErpHttpAdapter);
    expect(escolherErpAdapter({})).toBe(ErpArquivoAdapter);
    expect(escolherErpAdapter({ ERP_URL: '' })).toBe(ErpArquivoAdapter);
  });

  it('recusa valores que não são um modo, como "false"', () => {
    expect(() => escolherErpAdapter({ ERP_MODO: 'false' })).toThrow(
      'ERP_MODO inválido',
    );
  });

  it('recusa http sem ERP_URL', () => {
    expect(() => escolherErpAdapter({ ERP_MODO: 'http' })).toThrow(
      'exige ERP_URL',
    );
  });
});
