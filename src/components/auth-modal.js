import { useRef } from 'react';
import '../css/auth-modal.scss';

function AuthenticationModal(args)
{
  const passwordRef = useRef(null);
  const messageRef = useRef(null);

  function PasswordAuthenticate() {
    fetch(`${args.ServerURL}/api/authenticate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'authorization': btoa(passwordRef.current.value),
      }),
    })
    .then(response => {
      console.log(response);
      if (response.status != 200) {
        passwordRef.current.value = null;
        return messageRef.current.classList.remove('hidden');
      }

      return response.json();
    })
    .then(authorization => {
      if (authorization) {
        sessionStorage.setItem('authorization', authorization.cookie);
        messageRef.current.classList.add('hidden');
        args.authModalRef.current.classList.add('hidden');
        args.FetchFiles();
      }
    });
  }

  return (
    <div className='auth-modal hidden' ref={args.authModalRef}>
      <div className='auth-modal-content'>
        <header className='flex justify-between items-center'>
          <h4 className='font-bold'>Authentication Required</h4>
        </header>
        <hr/>

        <div className='bg-white shadow-md rounded px-8 pt-6 pb-8 mt-6'>
          <div className='mb-6'>
            <label className='block text-gray-700 text-sm font-bold mb-2'>File Hub Password</label>
            <input
              className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
              placeholder='Password'
              ref={passwordRef}
              type='password'
            />
          </div>
          <div className='flex'>
            <button
              onClick={PasswordAuthenticate}
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
              type='button'
            >
              Authenticate&nbsp;&nbsp;
              <i className='bi bi-arrow-right'></i>
            </button>

            <div className='ml-6 mt-2 hidden' ref={messageRef}>
              <span className='text-red-500 font-bold'>Incorrect password</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
export default AuthenticationModal;