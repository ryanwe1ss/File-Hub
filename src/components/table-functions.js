function TableFunctions(args)
{
  let debounceDelay = null;

  function DownloadFiles() {
    const request = new XMLHttpRequest();

    request.open('POST', `${args.ServerURL}/api/download`);
    request.setRequestHeader('Content-Type', 'application/json');
    request.withCredentials = true;
    request.responseType = 'blob';

    request.addEventListener('progress', (event) => {
      const percent = Math.round((event.loaded / event.total) * 100);
      args.loadingBarRef.current.style.width = `${percent}%`;
    });
    
    request.addEventListener('load', () => {
      const instance = document.createElement('a');

      instance.href = window.URL.createObjectURL(request.response);
      instance.download = args.itemsSelected.length == 1 ? args.itemsSelected[0].name : 'files.zip';
      instance.click();

      args.loadingBarRef.current.style.width = '0%';
    });

    request.send(JSON.stringify(args.itemsSelected));
  }

  function DeleteFiles() {
    if (args.itemsSelected.length == 0) return;

    fetch(`${args.ServerURL}/api/delete`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(args.itemsSelected),
    })
    .then(response => {
      if (response.status != 200) {
        alert(`Problem Deleting File(s) - Error: [${response.status}]`);
      }
    });

    document.querySelectorAll('tr').forEach(row => row.classList.remove('bg-blue-100'));
    args.setItemsSelected([]);
  }

  return (
    <div className='mb-4 flex'>
      <div className='flex mr-auto' style={{marginRight: '30px'}}>
        <input type='text' ref={args.searchRef} placeholder='Search...' onKeyUp={() => {
          clearTimeout(debounceDelay);
          debounceDelay = setTimeout(args.FetchFiles, 300);

        }} className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-600'/>

        <select
          ref={args.limitRef}
          onChange={args.FetchFiles}
          className='ml-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-600'
        >
          {args.limits.map((limit, index) => {
            return <option key={index} value={limit}>{limit}</option>;
          })}
          <option value={args.count}>All: {args.count}</option>
        </select>

        {!args.filesLoaded ?
          <div>
            <div className='tiny-spinner'></div>
          </div> : null
        }
      </div>

      {args.userCount}
      <div className='flex ml-auto'>
        {!args.authenticated ?
          <button className='mr-3 ml-12'><i className='bi bi-lock-fill text-2xl text-red-500'></i></button> :
          <button className='mr-3 ml-12'><i className='bi bi-unlock-fill text-2xl text-green-500'></i></button>
        }

        <div className='download-bar mt-auto mr-3'>
          <div className='download' ref={args.loadingBarRef}></div>
        </div>

        <button
          onClick={() => args.setShowFileModal(true)}
          disabled={args.itemsSelected.length != 1}
          className='bg-orange-500 hover:bg-orange-700 text-white py-2 px-4 rounded mr-2'
        >
          <i className='bi bi-card-list'></i>
        </button>

        <button
          onClick={DownloadFiles}
          disabled={args.itemsSelected.length == 0}
          className='bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mr-2'
          >
            <i className='bi bi-download'></i>
        </button>

        <button
          onClick={() => args.fileInputRef.current.click()}
          className='bg-purple-500 hover:bg-purple-700 text-white py-2 px-4 rounded mr-2'
        >
          <i className='bi bi-upload'></i>
        </button>

        <button
          onClick={DeleteFiles}
          disabled={args.itemsSelected == 0}
          className='bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded mr-3'
          >
            <i className='bi bi-trash'></i>
        </button>
      </div>
    </div>
  );
}
export default TableFunctions;