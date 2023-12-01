function ArgentinianButton({
  text,
  disabled,
  width,
  textSize,
  p,
  onClick,
}: {
  text: string;
  disabled?: boolean;
  width?: number;
  textSize?: 'xl' | 'sm' | 'md' | 'xs';
  p?: number;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={
        onClick
          ? onClick
          : () => {
              return;
            }
      }
      className={`text-${textSize ? textSize : 'xl'} p-${
        p ? p : 2
      } bg-argentinian w-[${
        width ? width : 90
      }px] rounded-xl text-center border border-jet block hover:bg-argentinian-light disabled:bg-gray-500  transition-all`}
    >
      {text}
    </button>
  );
}

export default ArgentinianButton;
