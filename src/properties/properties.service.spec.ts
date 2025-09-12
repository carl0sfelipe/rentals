import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service';

interface Property { id: string; title: string; description?: string; ownerId: string }

const properties: Property[] = [];

const prismaMock = {
  property: {
    create: vi.fn(async ({ data }) => {
      const newProp: Property = { id: String(properties.length + 1), ...data };
      properties.push(newProp);
      return newProp;
    }),
    findUnique: vi.fn(async ({ where: { id } }) => properties.find((p) => p.id === id) || null),
    update: vi.fn(async ({ where: { id }, data }) => {
      const idx = properties.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      properties[idx] = { ...properties[idx], ...data };
      return properties[idx];
    }),
    delete: vi.fn(async ({ where: { id } }) => {
      const idx = properties.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const removed = properties.splice(idx, 1)[0];
      return removed;
    }),
  },
};

describe('PropertiesService (unit)', () => {
  let service: PropertiesService;
  const ownerA = 'user-a';
  const ownerB = 'user-b';

  beforeEach(() => {
    properties.length = 0;
    vi.clearAllMocks();
    service = new PropertiesService(prismaMock as any);
  });

  describe('create', () => {
    it('deve associar propriedade ao userId correto', async () => {
      const prop = await service.create(ownerA, { title: 'Casa 1' });
      expect(prop.ownerId).toBe(ownerA);
      expect(prismaMock.property.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('retorna propriedade se owner correto', async () => {
      const created = await service.create(ownerA, { title: 'Apto' });
      const found = await service.findOne(ownerA, created.id);
      expect(found.id).toBe(created.id);
    });

    it('lança Forbidden se owner diferente', async () => {
      const created = await service.create(ownerA, { title: 'Apto' });
      await expect(service.findOne(ownerB, created.id)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lança NotFound se não existe', async () => {
      await expect(service.findOne(ownerA, '999')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('atualiza se owner correto', async () => {
      const created = await service.create(ownerA, { title: 'Velho' });
      const updated = await service.update(ownerA, created.id, { title: 'Novo' });
      expect(updated.title).toBe('Novo');
    });

    it('lança Forbidden se owner diferente', async () => {
      const created = await service.create(ownerA, { title: 'Velho' });
      await expect(service.update(ownerB, created.id, { title: 'Hack' })).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('remove se owner correto', async () => {
      const created = await service.create(ownerA, { title: 'Deletar' });
      const res = await service.remove(ownerA, created.id);
      expect(res).toEqual({ deleted: true });
      expect(properties.find((p) => p.id === created.id)).toBeUndefined();
    });

    it('lança Forbidden se owner diferente', async () => {
      const created = await service.create(ownerA, { title: 'Deletar' });
      await expect(service.remove(ownerB, created.id)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
