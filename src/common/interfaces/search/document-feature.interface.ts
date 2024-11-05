import { Document } from '@prisma/client';

import { Feature } from '@common/enums';
import {
  BaseFeature,
  NamedFeature,
  uploadedAtFeature,
} from '@common/interfaces';

export interface DocumentFeature
  extends Document,
    BaseFeature,
    NamedFeature,
    uploadedAtFeature {
  feature: Feature.Document;
  uploader: string;
}
