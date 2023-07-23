import '../css/auth-modal.scss';

function AuthenticationModal(args)
{
  function PasswordAuthenticate() {
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');

    fetch(`${args.server}/api/authenticate?token=${password}`)
      .then(response => {
        if (response.status != 200) return message.classList.remove('hidden');

        localStorage.setItem('token', password);
        message.classList.add('hidden');
        
        document.getElementById('modal').classList.add('hidden');
        document.getElementById('reload').click();
      }
    );
  }

  return (
    <div className="modal hidden" id="modal">
      <div className="modal-content">
        <header className='flex justify-between items-center'>
          <h4 className='font-bold'>Authentication Required</h4>
        </header>
        <hr/>

        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mt-6">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">File Hub Password</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="Password"
            />
          </div>
          <div className="flex">
            <button
              onClick={PasswordAuthenticate}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
            >
              Authenticate&nbsp;&nbsp;
              <i className='bi bi-arrow-right'></i>
            </button>

            <div className='ml-6 mt-2 hidden' id='message'>
              <span className='text-red-500 font-bold'>Incorrect password</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
export default AuthenticationModal;