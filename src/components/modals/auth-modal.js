import { useState } from 'react';
import '../../css/auth-modal.scss';

function AuthenticationModal(args)
{
  const [request, setRequest] = useState({
    message: 'Authenticate',
    authenticating: false,
    password: null,
  });

  const [alert, setAlert] = useState({
    message: null,
    open: false,
  });

  const PasswordAuthenticate = async () => {
    let body = {
      'authorization': btoa(request.password),
      'user_data': null,
    };

    if (process.env.TRACK_LOGIN == 'true') {
      try {
        const response = await fetch('https://ipapi.co/json');
    
        if (response.ok) {
          const data = await response.json();
          body.user_data = {
            user_agent: navigator.userAgent,
            ip_address: data.ip,
            country: data.country_name,
            postal_code: data.postal,
            region: data.region,
            city: data.city,
          };
        }
  
      } catch (error) {
        // do nothing, skip...
      }
    }

    setRequest({ ...request, authenticating: true, message: 'Authenticating...' });
    setAlert({ message: null, open: false });

    fetch(`${args.ServerURL}/api/authenticate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    .then(response => response.json())
    .then(data => {
      setRequest({ authenticating: false, password: null, message: 'Authenticate' });

      if (!data.success) {
        args.authModalRef.current.querySelector('input').select();
        return setAlert({ message: data.message, open: true });
      }

      setTimeout(() => window.location.reload(true), data.age * 1000);
      setAlert({ message: null, open: false });

      args.authModalRef.current.classList.add('hidden');
      args.FetchFiles(true);
    })
    .catch(() => {
      setRequest({ authenticating: false, password: null, message: 'Authenticate' });
      setAlert({ message: 'Server Error. Contact Administrator.', open: true });
    });
  }

  return (
    <div className='auth-modal hidden' ref={args.authModalRef}>
      <div className='auth-modal-content'>
        <header className='flex justify-between items-center'>
          <h4 className='font-bold underline'>Authentication Required</h4>
        </header>

        <div className='bg-white shadow-md rounded px-8 pt-6 pb-8 mt-3 border border-top-gray-200'>
          <div className='mb-6'>
            <label className='block text-gray-700 text-sm font-bold mb-2'>File Hub Password</label>
            <input
              onInput={(event) => setRequest({ ...request, password: event.target.value })}
              className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
              placeholder='Password'
              type='password'
            />
          </div>
          <div className='flex'>
            <button
              disabled={request.password == null || request.authenticating}
              onClick={PasswordAuthenticate}
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
              type='button'
            >
              {request.message}
            </button>

            <div className={`ml-6 mt-2 ${!alert.open && 'hidden'}`}>
              <span className='text-red-500 font-bold'>{alert.message}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AuthenticationModal;