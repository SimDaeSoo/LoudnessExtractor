import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { Select, SelectProps, Space, Steps, StepsProps } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyzeFilesStep } from '../components/AnalyzeFilesStep';
import { SelectFilesStep } from '../components/SelectFilesStep';
import { AnalyzeFile } from '../types/file';

const getLoudnessAnalyzeTemplates = async () => {
  try {
    const BASE_URL = 'https://vims-test.thepinkfong.com';
    const response = await fetch(`${BASE_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
        query {
          loudnessTemplates {
            id
            name
            groupName
            integratedLoudnessLow
            integratedLoudnessHigh
            truePeak
          }
        }
      `,
      }),
    });
    const { data } = await response.json();

    return data?.loudnessTemplates || [];
  } catch (e) {
    return [];
  }
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
    const templates = await getLoudnessAnalyzeTemplates();
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
