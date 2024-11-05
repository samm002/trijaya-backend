import { AppConfig } from '../../../src/config/app.config';

export function generateDefaultHeader(
  slug: string,
  type: string,
): { slug: string; url: string } {
  return {
    slug: type ? `default-${type}-of-${slug}` : `default-header-of-${slug}`,
    url: AppConfig.get<string>('DEFAULT_IMAGE'),
  };
}
