import { PLAYBOOK_TEMPLATES } from '../../domain/commercial/playbook.templates';
import { ValidationError } from '../../shared/utils/errors';

export interface NextActionInput {
  niche: string;
  leadStage?: string;
  intent?: 'BUY_NOW' | 'SUPPORT' | 'TRIAGE';
  score?: number;
}

export class CommercialEngineService {
  getTemplates() {
    return PLAYBOOK_TEMPLATES;
  }

  getTemplateByNiche(niche: string) {
    const found = PLAYBOOK_TEMPLATES.find(item => item.niche === niche.toLowerCase());
    if (!found) {
      throw new ValidationError(`Template de nicho não encontrado: ${niche}`);
    }
    return found;
  }

  getNextBestAction(input: NextActionInput) {
    const template = this.getTemplateByNiche(input.niche);
    const score = input.score ?? 0;
    const stage = input.leadStage || template.stages[0];
    const intent = input.intent || 'TRIAGE';

    if (intent === 'BUY_NOW' || score >= 80) {
      return {
        priority: 'high',
        action: 'handoff_human_closer',
        reason: 'Lead com alta intenção/comercial pronto para fechamento',
        stage,
        framework: template.framework
      };
    }

    if (intent === 'SUPPORT' || (score >= 40 && score < 80)) {
      return {
        priority: 'medium',
        action: 'send_case_study_and_schedule_meeting',
        reason: 'Lead em consideração, precisa prova social + reunião',
        stage,
        framework: template.framework
      };
    }

    return {
      priority: 'normal',
      action: 'run_discovery_questions',
      reason: 'Lead em triagem, coletar dados de qualificação',
      stage,
      questions: template.discoveryQuestions,
      framework: template.framework
    };
  }
}

export const commercialEngineService = new CommercialEngineService();
