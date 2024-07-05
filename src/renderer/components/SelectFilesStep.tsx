import { DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Table, TableProps, Typography } from 'antd';
import Dragger, { DraggerProps } from 'antd/es/upload/Dragger';
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { GoogleIcon } from '../components/GoogleIcon';
import { MEDIA_EXTENSIONS } from '../constants/file';
import { AnalyzeFile } from '../types/file';

const ACCEPTABLE_FILE_TYPES = MEDIA_EXTENSIONS.map((ext) => `.${ext}`).join(',');

const MAX_FILE_COUNT = 20;

export type SelectFilesStepProps = {
  files: Array<AnalyzeFile>;
  setFiles: Dispatch<SetStateAction<Array<AnalyzeFile>>>;
  onNextStep: (clear?: boolean) => void;
};

export const SelectFilesStep = ({ files, setFiles, onNextStep }: SelectFilesStepProps) => {
  const beforeUpload = useCallback(() => false, []);
  const onChange = useCallback<DraggerProps['onChange']>(({ file, fileList }) => {
    const matchedFile = fileList.find((f) => f.uid === file.uid)?.originFileObj;

    if (matchedFile) {
      setFiles((prev) => {
        if (prev.length < MAX_FILE_COUNT) {
          return [...prev, matchedFile];
        } else {
          return prev;
        }
      });
    }
  }, []);

  const onRemove = useCallback((uid: string) => {
    setFiles((prev) => {
      const matchedFile = prev.find((f) => f.uid === uid);

      if (matchedFile) {
        return prev.filter((f) => f.uid !== uid);
      } else {
        return prev;
      }
    });
  }, []);

  const columns: TableProps['columns'] = useMemo(
    () => [
      {
        title: '분석 파일',
        dataIndex: 'name',
        key: 'name',
        render: (text: string, file: AnalyzeFile) => (
          <Typography.Text ellipsis>
            <GoogleIcon mime={file.type} />
            {text}
          </Typography.Text>
        ),
      },
      {
        title: '',
        dataIndex: 'action',
        key: 'action',
        width: 40,
        render: (_: string, file: AnalyzeFile) => (
          <Button danger type='link' size='small' icon={<DeleteOutlined />} onClick={() => onRemove(file.uid)} />
        ),
      },
    ],
    []
  );

  const onClickNextStep = useCallback(() => {
    onNextStep(false);
  }, [onNextStep]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={files}
        size='small'
        rowKey='uid'
        scroll={{ y: 480 }}
        pagination={false}
        showHeader={false}
        virtual
        bordered
      />

      <Dragger
        className='h-full mt-[12px]'
        onChange={onChange}
        fileList={files}
        accept={ACCEPTABLE_FILE_TYPES}
        beforeUpload={beforeUpload}
        showUploadList={false}
        disabled={files.length >= MAX_FILE_COUNT}
        maxCount={MAX_FILE_COUNT}
        multiple
      >
        <p className='ant-upload-drag-icon'>
          <InboxOutlined />
        </p>
        <p className='ant-upload-text'>분석 파일 추가</p>
        <p className='ant-upload-hint'>
          클릭하거나 영역에 파일을 드롭하여 분석할 파일을 추가해주세요.
          <br />
          (최대 {MAX_FILE_COUNT}개까지 파일을 추가할 수 있습니다)
        </p>
      </Dragger>

      <Button className='mt-[12px]' type='primary' disabled={files.length === 0} onClick={onClickNextStep}>
        {files.length} 개 파일 분석 진행
      </Button>
    </>
  );
};
