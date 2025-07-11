import {
  CheckCircleFilled,
  CheckCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Descriptions, Divider, Space, Table, TableProps, Tag, Typography } from 'antd';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyzeFile } from '../types/file';
import { LoudnessTemplate } from '../types/template';
import { GoogleIcon } from './GoogleIcon';

export type AnalyzeFilesStepProps = {
  files: Array<AnalyzeFile>;
  setFiles: Dispatch<SetStateAction<Array<AnalyzeFile>>>;
  currentStep: number;
  onNextStep: (clear?: boolean) => void;
  currentTemplate?: LoudnessTemplate;
};

export const AnalyzeFilesStep = ({
  files,
  setFiles,
  currentStep,
  onNextStep,
  currentTemplate,
}: AnalyzeFilesStepProps) => {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const isAllDone = useMemo(
    () => files.every((file) => file.analyzeStatus === 'DONE' || file.analyzeStatus === 'ERROR'),
    [files]
  );

  const ROW_EXPANDABLE: TableProps<AnalyzeFile>['expandable'] = useMemo(
    () => ({
      defaultExpandAllRows: true,
      rowExpandable: (record: AnalyzeFile) => record.analyzeStatus === 'DONE',
      expandedRowRender: (record: AnalyzeFile) => {
        const hasIntegratedLoudnessAndTemplate =
          record?.loudness?.integratedLoudness?.i !== undefined && currentTemplate;
        const integratedLoudnessPassed =
          hasIntegratedLoudnessAndTemplate &&
          record.loudness.integratedLoudness.i >= currentTemplate.integratedLoudnessLow &&
          record.loudness.integratedLoudness.i <= currentTemplate.integratedLoudnessHigh;

        const truePeakLowPassed =
          record?.loudness?.truePeak?.peak !== undefined &&
          currentTemplate &&
          (currentTemplate.truePeakLow === undefined || record.loudness.truePeak.peak >= currentTemplate.truePeakLow);
        const truePeakHighPassed =
          record?.loudness?.truePeak?.peak !== undefined &&
          currentTemplate &&
          (currentTemplate.truePeakHigh === undefined || record.loudness.truePeak.peak <= currentTemplate.truePeakHigh);
        const truePeakPassed = truePeakLowPassed && truePeakHighPassed;

        return (
          <Descriptions
            className='mb-[24px]'
            labelStyle={{ width: '90px', textAlign: 'center' }}
            items={[
              {
                key: 'integratedLoudness',
                label: '평균 음량',
                children: (
                  <Space direction='vertical' size='small'>
                    <Tag
                      color={currentTemplate ? (integratedLoudnessPassed ? 'success' : 'error') : null}
                      icon={
                        currentTemplate ? (
                          integratedLoudnessPassed ? (
                            <CheckCircleOutlined />
                          ) : (
                            <WarningOutlined />
                          )
                        ) : null
                      }
                    >
                      {record?.loudness?.integratedLoudness?.i !== undefined
                        ? `${record?.loudness?.integratedLoudness?.i} LUFS`
                        : 'N/A'}
                      {currentTemplate && integratedLoudnessPassed && ' (적합)'}
                      {currentTemplate && !integratedLoudnessPassed && ' (부적합)'}
                    </Tag>
                    {currentTemplate && !integratedLoudnessPassed && (
                      <Tag icon={<InfoCircleOutlined />} color='warning'>
                        허용 범위
                        <Divider type='vertical' />
                        {currentTemplate.integratedLoudnessLow} LUFS 이상
                        <Divider type='vertical' />
                        {currentTemplate.integratedLoudnessHigh} LUFS 이하
                      </Tag>
                    )}
                  </Space>
                ),
              },
              {
                key: 'truePeak',
                label: '트루피크',
                children: (
                  <Space direction='vertical' size='small'>
                    <Tag
                      color={currentTemplate ? (truePeakPassed ? 'success' : 'error') : null}
                      icon={currentTemplate ? truePeakPassed ? <CheckCircleOutlined /> : <WarningOutlined /> : null}
                    >
                      {record?.loudness?.integratedLoudness?.i !== undefined
                        ? `${record?.loudness?.truePeak?.peak} dBFS`
                        : 'N/A'}
                      {currentTemplate && truePeakPassed && ' (적합)'}
                      {currentTemplate && !truePeakPassed && ' (부적합)'}
                    </Tag>
                    {currentTemplate && !truePeakPassed && (
                      <Tag icon={<InfoCircleOutlined />} color='warning'>
                        허용 범위
                        {currentTemplate.truePeakLow !== undefined && (
                          <>
                            <Divider type='vertical' />
                            {currentTemplate.truePeakLow} dBFS 이상
                          </>
                        )}
                        {currentTemplate.truePeakHigh !== undefined && (
                          <>
                            <Divider type='vertical' />
                            {currentTemplate.truePeakHigh} dBFS 이하
                          </>
                        )}
                      </Tag>
                    )}
                  </Space>
                ),
              },
              {
                key: 'lra',
                label: '음량 범위',
                children: (
                  <>
                    <Tag>
                      {record?.loudness?.loudnessRange?.lraLow !== undefined
                        ? `Low ${record?.loudness?.loudnessRange?.lraLow} LUFS`
                        : 'Low N/A'}
                      <Divider type='vertical' />
                      {record?.loudness?.loudnessRange?.lraHigh !== undefined
                        ? `High ${record?.loudness?.loudnessRange?.lraHigh} LUFS`
                        : 'High N/A'}
                    </Tag>
                  </>
                ),
              },
              {
                key: 'pass',
                label: '적합 여부',
                children: currentTemplate ? (
                  !integratedLoudnessPassed || !truePeakPassed ? (
                    <Typography.Text className='text-xs'>
                      <Typography.Text type='danger' strong underline>
                        부적합
                      </Typography.Text>
                      <br />
                      특별한 사유가 없다면 마스터 수정 부탁드립니다.
                      <br />
                      <br />
                      사유가 있다면 VIMS 업로드 시{' '}
                      <Typography.Text type='danger' strong underline>
                        비고 사항에 해당 내용 꼭 기재
                      </Typography.Text>{' '}
                      부탁드립니다.
                      <br />
                      <Typography.Text className='text-xs' type='secondary'>
                        (제작 의도인지 오류인지 동기화 필요)
                      </Typography.Text>
                      <br />
                      <br />
                      자세한 기준은 더핑컴 오디오 가이드 확인 부탁드립니다.
                    </Typography.Text>
                  ) : (
                    <Typography.Text className='text-xs'>
                      <Typography.Text type='success' strong underline>
                        적합
                      </Typography.Text>
                      <br />
                      콘텐츠가 오차 범위 내에 있습니다.
                    </Typography.Text>
                  )
                ) : (
                  <Typography.Text className='text-xs' type='secondary'>
                    출시 플랫폼을 고려하여 최종 마스터 볼륨 셋팅 부탁드립니다.
                    <br />
                    (도움이 필요하시면 뮤직크리에이티브랩에 문의해주세요.)
                  </Typography.Text>
                ),
              },
            ]}
            size='small'
            bordered
          />
        );
      },
      showExpandColumn: false,
    }),
    [currentTemplate]
  );

  const columns: TableProps['columns'] = useMemo(
    () => [
      {
        title: '파일이름',
        dataIndex: 'name',
        key: 'name',
        render: (text: string, file: AnalyzeFile) => (
          <Typography.Text ellipsis>
            <GoogleIcon mime={file.type} />
            {text}
            {file.analyzeStatus === 'DONE' && <CheckCircleFilled className='ml-[8px] text-green-500' />}
            {file.analyzeStatus === 'PROGRESS' && <LoadingOutlined className='ml-[8px] text-blue-500' />}
            {file.analyzeStatus === 'ERROR' && <WarningOutlined className='ml-[8px] text-red-500' />}
          </Typography.Text>
        ),
      },
    ],
    []
  );

  const onClickInitialize = useCallback(() => {
    onNextStep(true);
  }, [onNextStep]);

  const analyze = useCallback(
    async (index: number) => {
      const file = files[index];

      setFiles((prev) => {
        const matchedFile = prev.find((f) => f.uid === file.uid);

        if (matchedFile) {
          matchedFile.analyzeStatus = 'PROGRESS';
        }
        return [...prev];
      });

      const { status, summary } = await window.ffmpeg.extractLoudnessSummary(file.path);

      setFiles((prev) => {
        const matchedFile = prev.find((f) => f.uid === file.uid);

        if (matchedFile) {
          matchedFile.analyzeStatus = status;
          matchedFile.loudness = summary;
        }
        return [...prev];
      });
    },
    [files, setFiles]
  );

  useEffect(() => {
    const isAllDone = files.every((file) => file.analyzeStatus === 'DONE' || file.analyzeStatus === 'ERROR');

    if (!isAllDone) {
      const index = files.findIndex((file) => file.analyzeStatus === null || file.analyzeStatus === undefined);
      const currentFile = files[currentIndex];

      if (!currentFile || currentFile.analyzeStatus === 'DONE' || currentFile.analyzeStatus === 'ERROR') {
        setCurrentIndex(index);
        analyze(index);
      }
    }
  }, [files, currentIndex, setCurrentIndex, analyze, onNextStep]);

  useEffect(() => {
    if (currentStep === 1 && isAllDone) {
      onNextStep();
    }
  }, [currentStep, isAllDone]);

  return (
    <>
      <Table
        className='mt-[12px]'
        columns={columns}
        dataSource={files}
        size='small'
        rowKey='uid'
        pagination={false}
        showHeader={false}
        expandable={ROW_EXPANDABLE}
      />
      <Button className='mt-[12px]' type='primary' disabled={!isAllDone} onClick={onClickInitialize}>
        분석 초기화
      </Button>
    </>
  );
};
