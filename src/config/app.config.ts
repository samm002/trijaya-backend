import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  static service: ConfigService;

  constructor(service: ConfigService) {
    AppConfig.service = service;
  }

  static get<T = any>(key: string): T {
    return AppConfig.service.get<T>(key);
  }
}
