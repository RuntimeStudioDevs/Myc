import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  correctConstructionText,
  correctProjectName,
  correctCommercialNotes,
  normalizeEngineeringUnits,
} from '../shared/utils/orthography-corrector';

describe('Corrector Ortográfico y de Puntuación de Obra Civil', () => {
  it('Aplica tildes correctas a procesos y actividades de ingeniería (-ción, -ía, -ico)', () => {
    const raw = 'excavacion manual, demolicion de muros, instalacion hidraulica y tuberia';
    const { corrected } = correctConstructionText(raw);

    assert.ok(corrected.includes('Excavación manual'));
    assert.ok(corrected.includes('demolición de muros'));
    assert.ok(corrected.includes('instalación hidráulica'));
    assert.ok(corrected.includes('tubería.'));
  });

  it('Preserva el casing original (Mayúsculas, Minúsculas, Title Case)', () => {
    assert.strictEqual(
      correctConstructionText('INSTALACION ELECTRICA', { ensureEndingPeriod: false }).corrected,
      'INSTALACIÓN ELÉCTRICA'
    );

    assert.strictEqual(
      correctConstructionText('Instalacion Electrica', { ensureEndingPeriod: false }).corrected,
      'Instalación Eléctrica'
    );

    assert.strictEqual(
      correctConstructionText('mamposteria estructural', { ensureEndingPeriod: false }).corrected,
      'Mampostería estructural'
    );
  });

  it('Normaliza unidades técnicas de ingeniería (m², m³, PSI)', () => {
    const raw = 'suministro de 120 m2 de panete y 45 m3 de hormigon a 3000 psi';
    const { corrected } = correctConstructionText(raw);

    assert.ok(corrected.includes('120 m²'));
    assert.ok(corrected.includes('pañete'));
    assert.ok(corrected.includes('45 m³'));
    assert.ok(corrected.includes('hormigón'));
    assert.ok(corrected.includes('3000 PSI'));
  });

  it('Protege especificaciones técnicas, fracciones de pulgada y acrónimos', () => {
    const raw = 'tuberia pvc de 1/2" y varilla de 3/8" para concreto 3000 psi';
    const { corrected } = correctConstructionText(raw);

    assert.ok(corrected.includes('Tubería PVC'));
    assert.ok(corrected.includes('1/2"'));
    assert.ok(corrected.includes('3/8"'));
    assert.ok(corrected.includes('3000 PSI.'));
  });

  it('Aplica mayúscula tras punto y asegura punto final en descripciones', () => {
    const raw = 'demolicion de piso existente. retiro de escombros y limpieza';
    const { corrected } = correctConstructionText(raw);

    assert.strictEqual(
      corrected,
      'Demolición de piso existente. Retiro de escombros y limpieza.'
    );
  });

  it('Formatea nombres de proyectos sin punto final y con Title Case inteligente', () => {
    const input = 'construccion y remodelacion de bodegas y oficinas en medellin';
    const output = correctProjectName(input);

    assert.strictEqual(
      output,
      'Construcción y Remodelación de Bodegas y Oficinas en Medellín'
    );
    assert.ok(!output.endsWith('.'));
  });

  it('Normaliza notas comerciales y condiciones de pago', () => {
    const input = 'el pago se realiza con anticipo del 50% y liquidacion final del 50%';
    const output = correctCommercialNotes(input);

    assert.strictEqual(
      output,
      'El pago se realiza con anticipo del 50% y liquidación final del 50%.'
    );
  });
});
