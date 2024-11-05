import { Blog } from '@prisma/client';

import { Feature } from '@common/enums';
import {
  BaseFeature,
  TitledFeature,
  UpdatedAtFeature,
} from '@common/interfaces';

export interface BlogFeature
  extends Blog,
    BaseFeature,
    TitledFeature,
    UpdatedAtFeature {
  feature: Feature.Blog;
  author: string;
}
