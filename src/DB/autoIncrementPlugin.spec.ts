import { describe, expect, it } from 'vitest';
import { Schema, model } from 'mongoose';
import { autoIncrementPlugin } from './autoIncrementPlugin';

describe('autoIncrementPlugin DB Plugin', () => {
  interface ITestDoc {
    uid?: string;
    name: string;
  }

  const testSchema = new Schema<ITestDoc>({
    uid: { type: String, unique: true },
    name: { type: String, required: true },
  });

  testSchema.plugin(autoIncrementPlugin, {
    incField: 'uid',
    prefix: 'TEST',
    counterId: 'test_counter_id',
    padLength: 4,
  });

  const TestModel = model<ITestDoc>('AutoIncrementTest', testSchema);

  it('should automatically assign incremented sequential formatted UIDs on document creation', async () => {
    const doc1 = await TestModel.create({ name: 'First Item' });
    expect(doc1.uid).toBe('TEST-0001');

    const doc2 = await TestModel.create({ name: 'Second Item' });
    expect(doc2.uid).toBe('TEST-0002');
  });
});
