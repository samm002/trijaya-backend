import { Business } from '@prisma/client';

import { Feature } from '@common/enums';
import {
  BaseFeature,
  TitledFeature,
  UpdatedAtFeature,
} from '@common/interfaces';

export interface BusinessFeature
  extends Business,
    BaseFeature,
    TitledFeature,
    UpdatedAtFeature {
  feature: Feature.Business;
}
