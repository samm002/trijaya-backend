import { Album } from '@prisma/client';

import { Feature } from '@common/enums';
import {
  BaseFeature,
  NamedFeature,
  UpdatedAtFeature,
} from '@common/interfaces';

export interface AlbumFeature
  extends Album,
    BaseFeature,
    NamedFeature,
    UpdatedAtFeature {
  feature: Feature.Album;
  creator: string;
}
