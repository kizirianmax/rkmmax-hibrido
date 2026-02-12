/**
 * TESTE BÁSICO PARA VALIDAÇÃO DE CI
 */

describe('Basic Test Suite', () => {
  test('should pass basic assertion', () => {
    expect(true).toBe(true);
  });

  test('should perform arithmetic correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle strings', () => {
    expect('hello').toBe('hello');
  });

  test('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('should handle objects', () => {
    const obj = { name: 'test', value: 123 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(123);
  });
});
