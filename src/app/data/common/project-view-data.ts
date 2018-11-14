import { ProjectMapping, JiraProject, RexorProject } from './index';

export interface ProjectViewData {
    projectMappings: ProjectMapping[];
    unmappedJiraProjects: JiraProject[];
    rexorProjects: RexorProject[];
}
