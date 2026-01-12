import '../../css/timeout-modal.scss';

export default function SessionTimeoutModal(args)
{
  const handleRenewSession = () => {
    fetch(`${args.ServerURL}/api/renew-session`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
    })
    .then(response => response.json())
    .then((data) => {
      if (data.success) {
        sessionStorage.setItem('session_timeout', Date.now() + data.time_left);
        args.setTimeLeft(0);
        args.close(false);
      }
    });
  };

  const handleIgnore = () => {
    args.modalClose.current = true;
    args.close(false);
  };

  if (args.show) {
    return (
      <div className='timeout-modal' id='timeout-modal'>
        <div className='timeout-modal-content'>
          <header className='flex justify-between'>
            <h2 className='font-bold'>Session Timeout</h2>

            <button
              className='mt-[-10px] text-black float-right text-2xl font-bold hover:text-red-500 hover:cursor-pointer'
              onClick={handleIgnore}
            >
              &times;
            </button>
          </header>
          <hr/><br/>

          {args.timeLeft &&
            <div>
              <p>Your session is about to expire in&nbsp;
                <strong>
                  {Math.ceil(args.timeLeft / 60000)} {Math.ceil(args.timeLeft / 60000) === 1 ? 'minute' : 'minutes'}
                </strong>.</p>
              <hr/><br/>
              <p>Please click "Renew Session" to continue your work without losing any unsaved changes.</p>
            </div>
          }

          <div className='flex justify-start mt-2'>
            <button
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              onClick={handleRenewSession}
            >
              Renew Session
            </button>
          </div>
        </div>
      </div>
    );
  }
}