function ArgentinianButton({ text, disabled }: { text: string, disabled?: boolean }) {
  return (
    <button disabled={disabled} className='text-xl p-2 bg-argentinian w-[90px] rounded-xl text-center border border-jet block hover:bg-argentinian-light disabled  transition-all'>
      {text}
    </button>
  );
}

export default ArgentinianButton;
