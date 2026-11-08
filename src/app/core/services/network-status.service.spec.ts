import { calcularCalidad } from './network-status.service';

describe('calcularCalidad', () => {
  it('clasifica como "buena" una latencia menor a 300 ms', () => {
    expect(calcularCalidad(50)).toBe('buena');
    expect(calcularCalidad(299)).toBe('buena');
  });

  it('clasifica como "regular" una latencia entre 300 y 799 ms', () => {
    expect(calcularCalidad(300)).toBe('regular');
    expect(calcularCalidad(799)).toBe('regular');
  });

  it('clasifica como "lenta" una latencia de 800 ms o más', () => {
    expect(calcularCalidad(800)).toBe('lenta');
    expect(calcularCalidad(5000)).toBe('lenta');
  });
});
