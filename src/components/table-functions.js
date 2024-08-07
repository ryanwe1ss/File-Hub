function TableFunctions(args)
{
  let debounceDelay = null;

  function DownloadFiles() {
    const files = [];
    const request = new XMLHttpRequest();
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    for (let file = 1; file < checkboxes.length; file++) {
      if (checkboxes[file].checked) {
        files.push({ name: checkboxes[file].parentNode.parentNode.childNodes[2].innerHTML });
      }
    
    } if (files.length == 0) return;

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
      instance.download = files.length == 1 ? files[0].name : 'files.zip';
      instance.click();

      args.checkAllRef.current.checked = false;
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });

      args.loadingBarRef.current.style.width = '0%';
      args.setItemsSelected(0);
    });

    request.send(JSON.stringify(files));
  }

  function DeleteFiles() {
    const files = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    for (let i = 1; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        files.push({ name: checkboxes[i].parentNode.parentNode.childNodes[2].innerHTML });
      }
    
    } if (files.length == 0) return;

    fetch(`${args.ServerURL}/api/delete`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(files),
    })
    .then(response => {
      if (response.status != 200) {
        alert(`Problem Deleting File(s) - Error: [${response.status}]`);
      }
    });

    args.checkAllRef.current.checked = false;
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    
    }); args.setItemsSelected(0);
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
          disabled={args.itemsSelected != 1}
          className='bg-orange-500 hover:bg-orange-700 text-white py-2 px-4 rounded mr-2'
        >
          <i className='bi bi-card-list'></i>
        </button>

        <button
          onClick={DownloadFiles}
          disabled={args.itemsSelected == 0}
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