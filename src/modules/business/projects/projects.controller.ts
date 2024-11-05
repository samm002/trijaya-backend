import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Public } from '@common/decorators';
import { JwtGuard } from '@common/guards';
import { successResponsePayload } from '@common/utils';
import {
  CreateProjectDto,
  GetProjectDto,
  UpdateProjectDto,
} from '@modules/business/projects/dtos';
import { ProjectsService } from '@modules/business/projects/projects.service';

@UseGuards(JwtGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projectService: ProjectsService) {}

  @Public()
  @Get()
  async getAllProject(@Query() query: GetProjectDto) {
    const { total, data, newest } =
      await this.projectService.getAllProject(query);

    return successResponsePayload('Get all project', data, total, newest);
  }

  @Public()
  @Get(':projectSlug')
  async getProjectBySlug(@Param('projectSlug') projectSlug: string) {
    const project = await this.projectService.getProjectBySlug(projectSlug);

    return successResponsePayload(
      `Get project by slug ${projectSlug}`,
      project,
    );
  }

  @Post()
  async createProject(@Body() dto: CreateProjectDto) {
    const project = await this.projectService.createProject(dto);

    return successResponsePayload('Create project', project);
  }

  @Patch(':projectSlug')
  async updateProjectBySlug(
    @Param('projectSlug') projectSlug: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const project = await this.projectService.updateProjectBySlug(
      projectSlug,
      dto,
    );

    return successResponsePayload(
      `Update project by slug ${projectSlug}`,
      project,
    );
  }

  @Delete(':projectSlug')
  async deleteProjectBySlug(@Param('projectSlug') projectSlug: string) {
    const project = await this.projectService.deleteProjectBySlug(projectSlug);

    return successResponsePayload(
      `Delete project by slug ${projectSlug}`,
      project,
    );
  }
}
