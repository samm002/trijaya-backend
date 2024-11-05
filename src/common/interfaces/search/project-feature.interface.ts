import { Project } from '@prisma/client';

import { Feature } from '@common/enums';
import {
  BaseFeature,
  TitledFeature,
  UpdatedAtFeature,
} from '@common/interfaces';

export interface ProjectFeature
  extends Project,
    BaseFeature,
    TitledFeature,
    UpdatedAtFeature {
  feature: Feature.Project;
  business: string;
}
