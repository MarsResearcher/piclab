import type { Experiment, ParamValues } from '../core/experiment';
import { cloneImageData } from '../lib/color';

/**
 * Copy this file when adding a new experiment.
 * Aim for: principle → observe list → probes that teach → aux visualization.
 */
const template: Experiment = {
  id: 'template',
  name: 'Template',
  description: 'Boilerplate — replace me.',
  principle: 'What underlying idea does this explore?',
  observe: ['What should the user look at first?', 'What surprise should they notice?'],
  category: 'other',
  realtime: true,
  probes: [
    {
      id: 'demo',
      label: '① 试一下',
      notice: 'Tell them what just became visible.',
      params: { amount: 0.5 },
    },
  ],
  params: [
    {
      key: 'amount',
      label: 'Amount',
      type: 'number',
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      hint: 'Explain the algorithmic role, not the UI role',
    },
  ],
  apply(imageData: ImageData, _params: ParamValues) {
    return {
      imageData: cloneImageData(imageData),
      meta: {
        narration: 'Describe what the algorithm did in one or two sentences.',
        auxLabel: '原理视窗',
      },
    };
  },
};

export default template;
