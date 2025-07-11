import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { Select, SelectProps, Space, Steps, StepsProps } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyzeFilesStep } from '../components/AnalyzeFilesStep';
import { SelectFilesStep } from '../components/SelectFilesStep';
import { AnalyzeFile } from '../types/file';
import { LoudnessTemplate } from '../types/template';

const getLoudnessAnalyzeTemplates = () => {
  const templates: Array<LoudnessTemplate> = [
    {
      id: 1,
      groupName: 'ST',
      name: '음원 (유아동 타겟)',
      integratedLoudnessHigh: -7.5,
      integratedLoudnessLow: -11.5,
      truePeakHigh: -0.1,
    },
    {
      id: 2,
      groupName: 'ST',
      name: '음원 (전연령 타겟)',
      integratedLoudnessHigh: -5.5,
      integratedLoudnessLow: -8.5,
      truePeakHigh: -0.1,
    },
    {
      id: 3,
      groupName: 'ST',
      name: '이야기/동화/뮤지컬 (트랙 내 스토리 포함)',
      integratedLoudnessHigh: -13.5,
      integratedLoudnessLow: -14.5,
      truePeakHigh: -0.1,
    },
    {
      id: 4,
      groupName: 'ST',
      name: '음원 - 기타 (잔잔한 보컬곡)',
      integratedLoudnessHigh: -7.5,
      integratedLoudnessLow: -16.5,
      truePeakHigh: -0.1,
    },
    {
      id: 5,
      groupName: 'ST',
      name: '음원 - 기타 (잔잔한 연주곡)',
      integratedLoudnessHigh: -7.5,
      integratedLoudnessLow: -18.5,
      truePeakHigh: -0.1,
    },
    {
      id: 6,
      groupName: 'VS',
      name: 'VS',
      integratedLoudnessHigh: -13,
      integratedLoudnessLow: -15,
      truePeakLow: -1.5,
      truePeakHigh: -0.5,
    },
    {
      id: 7,
      groupName: 'VS',
      name: '내부 편집본 (Fla.)',
      integratedLoudnessHigh: -13,
      integratedLoudnessLow: -15,
      truePeakHigh: 0,
    },
    {
      id: 8,
      groupName: 'VO',
      name: 'Youtube 서비스용',
      integratedLoudnessHigh: -13,
      integratedLoudnessLow: -15,
      truePeakLow: -1.5,
      truePeakHigh: -0.5,
    },
    {
      id: 9,
      groupName: 'VO',
      name: 'Shorts/App/홍보영상',
      integratedLoudnessHigh: -13,
      integratedLoudnessLow: -15,
      truePeakLow: -1.5,
      truePeakHigh: -0.5,
    },
    {
      id: 10,
      groupName: 'VO',
      name: 'TV/OTT/극장판',
      integratedLoudnessHigh: -23.5,
      integratedLoudnessLow: -24.5,
      truePeakLow: -1.5,
      truePeakHigh: -0.5,
    },
    {
      id: 11,
      groupName: 'VO',
      name: '내부 편집본 (Fla.)',
      integratedLoudnessHigh: -13,
      integratedLoudnessLow: -15,
      truePeakHigh: 0,
    },
  ];

  return templates;
};

const MainPage = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [files, setFiles] = useState<Array<AnalyzeFile>>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState([]);
  const currentTemplate = useMemo(
    () => templates.find((template) => template.id === templateId),
    [templateId, templates]
  );

  const status = useMemo(() => {
    const isProgress = currentStep === 1;
    const isDone =
      currentStep === 1 && files.every((file) => file.analyzeStatus === 'DONE' || file.analyzeStatus === 'ERROR');

    if (isDone) {
      return 'DONE';
    } else if (isProgress) {
      return 'PROGRESS';
    } else {
      return 'WAIT';
    }
  }, [files, currentStep]);

  const initializeTemplates = useCallback(async () => {
    const templates = getLoudnessAnalyzeTemplates();
    setTemplates(templates);
  }, []);

  const templateOptions = useMemo<SelectProps['options']>(() => {
    const options: SelectProps['options'] = [];

    for (const template of templates) {
      if (template.groupName) {
        let group = options.find((option) => option.label === template.groupName);

        if (!group) {
          group = {
            label: template.groupName,
            options: [],
          };

          options.push(group);
        }

        group.options.push({
          label: template.name,
          value: template.id,
        });
      }
    }

    return options;
  }, [templates]);

  const onChangeTemplate = useCallback((id?: string) => {
    setTemplateId(id);
  }, []);

  const items = useMemo<StepsProps['items']>(() => {
    return [
      {
        title: '분석 파일 선택',
        description: '음량 분석을 위한 파일을 선택합니다.',
      },
      {
        title: `파일 음량 분석`,
        description: '선택된 파일의 음량을 분석합니다.',
        icon: status === 'DONE' ? <CheckCircleFilled /> : status === 'PROGRESS' ? <LoadingOutlined /> : null,
      },
      {
        title: (
          <Select
            className='w-full'
            placeholder='분석 템플릿을 선택해 주세요'
            options={templateOptions}
            value={templateId}
            onChange={onChangeTemplate}
            allowClear
          />
        ),
      },
    ];
  }, [status, templateId, templateOptions, onChangeTemplate]);

  const onNextStep = useCallback(
    (clear?: boolean) => {
      if (clear) {
        onChangeTemplate();
      }
      setCurrentStep((prev) => (prev < 2 ? prev + 1 : 0));
    },
    [onChangeTemplate, setCurrentStep]
  );

  useEffect(() => {
    if (currentStep === 0) {
      setFiles([]);
    }
  }, [currentStep]);

  useEffect(() => {
    initializeTemplates();
  }, []);

  return (
    <Space.Compact className='p-[12px] h-full w-full overflow-y-scroll' direction='vertical'>
      <Steps size='small' direction='vertical' current={currentStep} items={items} />

      {/* Step 1 */}
      {currentStep === 0 && <SelectFilesStep files={files} setFiles={setFiles} onNextStep={onNextStep} />}

      {/* Step 2 */}
      {(currentStep === 1 || currentStep === 2) && (
        <AnalyzeFilesStep
          files={files}
          setFiles={setFiles}
          onNextStep={onNextStep}
          currentStep={currentStep}
          currentTemplate={currentTemplate}
        />
      )}
    </Space.Compact>
  );
};

export default MainPage;
