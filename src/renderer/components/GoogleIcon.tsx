export type GoogleIconProps = {
  mime?: string;
  size?: number;
  className?: string;
};
export const GoogleIcon = ({ mime = 'application/octet-stream', size = 16, className = 'anticon mr-[8px]' }) => {
  return (
    <img className={className} src={`https://drive-thirdparty.googleusercontent.com/${size}/type/${mime}`} alt={mime} />
  );
};
