import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditLog, Setting, User } from '../../database/entities';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const DEFAULT_SETTINGS = {
  branding: {
    academyName: 'SystemGrid Academy',
    tagline: 'Practical IT Training by SystemGrid',
    logoUrl: '/logo.svg',
  },
  theme: {
    defaultTheme: 'light',
    primaryColor: '#007AFF',
    accentColor: '#0EA5E9',
  },
  contact: {
    supportEmail: 'support@thesystemgrid.com',
    academyEmail: 'academy@thesystemgrid.com',
    city: 'Karachi',
    website: 'https://academy.thesystemgrid.com',
  },
  whatsapp: {
    number: '923433133834',
    message: 'Assalam o Alaikum, I want to know more about SystemGrid Academy.',
    enabled: true,
  },
};

type SettingKey = keyof typeof DEFAULT_SETTINGS;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting) private readonly settings: Repository<Setting>,
    private readonly dataSource: DataSource,
  ) {}

  async getSettings() {
    const rows = await this.settings.find();
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return {
      settings: {
        branding: { ...DEFAULT_SETTINGS.branding, ...(stored.branding as object | undefined) },
        theme: { ...DEFAULT_SETTINGS.theme, ...(stored.theme as object | undefined) },
        contact: { ...DEFAULT_SETTINGS.contact, ...(stored.contact as object | undefined) },
        whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...(stored.whatsapp as object | undefined) },
      },
    };
  }

  async getPublicSettings() {
    const { settings } = await this.getSettings();
    return {
      branding: {
        academyName: settings.branding.academyName,
        tagline: settings.branding.tagline,
      },
      theme: settings.theme,
      whatsapp: settings.whatsapp.enabled
        ? { number: settings.whatsapp.number, message: settings.whatsapp.message }
        : null,
    };
  }

  async updateSettings(dto: UpdateSettingsDto, actorId: string) {
    const allowedKeys: SettingKey[] = ['branding', 'theme', 'contact', 'whatsapp'];
    await this.dataSource.transaction(async (manager) => {
      for (const key of allowedKeys) {
        if (!dto[key]) continue;
        const existing = await manager.findOne(Setting, { where: { key } });
        const value = { ...DEFAULT_SETTINGS[key], ...(existing?.value as object | undefined), ...dto[key] };
        await manager.save(Setting, existing ? { ...existing, value } : manager.create(Setting, { key, value }));
      }
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: actorId } as User,
          action: 'update',
          module: 'settings',
          recordId: 'academy-settings',
          metadata: { sections: allowedKeys.filter((key) => Boolean(dto[key])) },
        }),
      );
    });
    return this.getSettings();
  }
}
