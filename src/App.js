import React from 'react';

function App() {
  return (
    <div className='page'>
      <header>
        <div className='float-left'>
          <div className='dropzone'>
              <div className='mb-3'>
                  <p className='text-blue-700 mb-1'>Upload multiple files with the file dialog or by dragging and dropping them within the bordered region</p>
                  <input type='file' id='upload' multiple accept='image/*'/>
              </div>

              <div className='progress'>
                  <div id='progressBar' className='progress-bar' role='progressbar'/>
              </div>
              <label id='loader'/>
              <div id='fileList'/>
              <br/>
          </div>
        </div>

        <div className='float-right'>
          <button className='flex bg-green-500 text-white font-bold w-32 py-2 px-4 rounded'>Download</button>
          <button className='mt-2 bg-red-500 text-white font-bold w-32 py-2 px-4 rounded text-center'>Delete</button>
        </div>

        <div className="clear-both"></div>
        <br/>
      </header>

      <hr className="bg-blue-500 h-1 mb-2"/>
      <div className='body'>
        <input type='text' id='search' placeholder='Search...' className='border border-blue-500 rounded w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'/>
        <i className='bi bi-alarm-fill'></i>
      </div>
    </div>
  );
}

export default App;