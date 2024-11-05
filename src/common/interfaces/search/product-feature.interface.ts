import { Product } from '@prisma/client';

import { Feature } from '@common/enums';
import {
  BaseFeature,
  TitledFeature,
  UpdatedAtFeature,
} from '@common/interfaces';

export interface ProductFeature
  extends Product,
    BaseFeature,
    TitledFeature,
    UpdatedAtFeature {
  feature: Feature.Product;
  business: string;
}
