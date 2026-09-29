import { escolherErpAdapter } from './erp-adapter.factory';
import { HttpErpAdapter } from './http-erp.adapter';
import { ArquivoErpAdapter } from './arquivo-erp.adapter';
import { MockErpAdapter } from './mock-erp.adapter';

describe('escolherErpAdapter', () => {
  it('usa o modo informado em ERP_MODO', () => {
    expect(escolherErpAdapter({ ERP_MODO: 'mock' })).toBe(MockErpAdapter);
    expect(escolherErpAdapter({ ERP_MODO: 'arquivo' })).toBe(ArquivoErpAdapter);
    expect(
      escolherErpAdapter({ ERP_MODO: 'http', ERP_URL: 'http://erp' }),
    ).toBe(HttpErpAdapter);
  });

  it('aceita maiúsculas e espaços', () => {
    expect(escolherErpAdapter({ ERP_MODO: ' MOCK ' })).toBe(MockErpAdapter);
  });

  it('sem ERP_MODO mantém o comportamento antigo (ERP_URL decide)', () => {
    expect(escolherErpAdapter({ ERP_URL: 'http://erp' })).toBe(HttpErpAdapter);
    expect(escolherErpAdapter({})).toBe(ArquivoErpAdapter);
    expect(escolherErpAdapter({ ERP_URL: '' })).toBe(ArquivoErpAdapter);
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
