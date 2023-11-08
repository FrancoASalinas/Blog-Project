function CustomInput({onChange, password, id, autoFocus, autoComplete}: {onChange: (e: any) => void, id: string, password?: boolean, autoFocus?: boolean, autoComplete?: string}) {
    return ( 
        <input
        type={password ? 'password' : 'text'}
        onChange={onChange}
        id={id}
        autoComplete={autoComplete}
        className='outline-none p-[5px] text-xl border-jet border rounded-sm'
        autoFocus={autoFocus ? true : false}
      />

     );
}

export default CustomInput;