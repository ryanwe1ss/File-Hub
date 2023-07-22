const server = `http://${window.location.hostname}${process.env.USE_PORT_IN_URL === 'true' ? `:${process.env.SERVER_PORT}` : ''}`;
import { useEffect, useState } from "react";

function App()
{
  useEffect(() => FetchFiles(), []);

  const [count, setCount] = useState(0);
  const [files, setFiles] = useState([]);
  const [itemsSelected, setItemsSelected] = useState(0);
  let debounceDelay = null;

  const FileDrop = () => {
    const dropzone = document.querySelector(".dropzone");

    ["dragenter", "dragover", "dragleave", "drop"].forEach(evtName => {
        dropzone.addEventListener(evtName, (e) => e.preventDefault());
    });

    ["dragenter", "dragover"].forEach(evtName => {
        dropzone.addEventListener(evtName, () => dropzone.classList.add("zoneborder"));
    });

    ["dragleave", "drop"].forEach(evtName => {
        dropzone.addEventListener(evtName, () => dropzone.classList.remove("zoneborder"));
    });

    dropzone.addEventListener("drop", UploadFiles);
  }

  function FetchFiles() {
    const searchQuery = document.getElementById('search').value;
    const limit = document.getElementById('limit').value;

    const previousTbody = document.querySelector('tbody');
    const tempTbody = document.createElement('tbody');
    const loadingRow = document.createElement('tr');

    loadingRow.innerHTML = (`
      <td colspan="6">
        <div class="spinner"></div>
      </td>
    `);
    
    tempTbody.appendChild(loadingRow);
    previousTbody.parentNode.replaceChild(tempTbody, previousTbody);

    // Fetch Files
    fetch(`${server}/api/files?name=${searchQuery}&limit=${limit}`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
    })
    .then(response => response.json())
    .then(result => {
      if (tempTbody.parentNode) tempTbody.parentNode.replaceChild(previousTbody, tempTbody);
      else location.reload();

      setCount(searchQuery ? result.files.length : result.count);
      setFiles(result.files);
    });
  }

  function UploadFiles(event) {
    const form = new FormData();
    const files = event.type == 'drop' ? event.dataTransfer.files : event.target.files;

    for (let i = 0; i < files.length; i++) {
      form.append('files', files[i]);
    }

    fetch(`${server}/api/upload`, {
      method: 'POST',
      body: form,
    })
    .then(() => {
      setTimeout(() => FetchFiles(), 100);

      setItemsSelected(0);
      document.getElementById('checkbox-all').checked = false;
    });
  }

  function DownloadFiles() {
    const files = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    for (let file = 1; file < checkboxes.length; file++) {
      if (checkboxes[file].checked) {
        files.push({ name: checkboxes[file].parentNode.parentNode.childNodes[2].innerHTML });
      }
    
    } if (files.length == 0) return;

    fetch(`${server}/api/download`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(files),
    })
    .then(response => {
      if (response.status == 200) return response.blob();
      else alert(`Problem Downloading File(s) - Error: [${response.status}]`);
    })
    .then(data => {
      const instance = document.createElement('a');
      instance.href = window.URL.createObjectURL(data);

      if (files.length == 1) {
        instance.download = files[0].name;
        instance.click();
      
      } else {
        instance.download = 'files.zip';
        instance.click();
      }

      document.getElementById('checkbox-all').checked = false;
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      
      }); setItemsSelected(0);
    });
  }

  function DeleteFiles() {
    const files = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    for (let i = 1; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        files.push({ name: checkboxes[i].parentNode.parentNode.childNodes[2].innerHTML });
      }
    
    } if (files.length == 0) return;

    fetch(`${server}/api/delete`, {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(files),
    })
    .then(response => {
      if (response.status == 200) FetchFiles();
      else alert(`Problem Deleting File(s) - Error: [${response.status}]`);
    });

    document.getElementById('checkbox-all').checked = false;
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    
    }); setItemsSelected(0);
  }

  function CheckAll() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
      checkbox.checked = document.getElementById('checkbox-all').checked;
      if (checkbox.checked) setItemsSelected(checkboxes.length - 1);
      else setItemsSelected(0);
    });
  }

  function CheckBox(event) {
    if (event.target.checked) {
      setItemsSelected(itemsSelected + 1);
    
    } else setItemsSelected(itemsSelected - 1);
  }

  return (
    <div className='page'>

      <div className="w-full">
        <div className="mb-4">
          <input type='text' id='search' placeholder='Search...' onKeyUp={() => {
            clearTimeout(debounceDelay);
            debounceDelay = setTimeout(FetchFiles, 300);

          }} className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-600'/>

          <select
            id="limit"
            onChange={() => FetchFiles(document.getElementById('limit').value)}
            className="ml-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-600"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value={count}>All: {count}</option>
          </select>

          <button onClick={FetchFiles}><i className='bi bi-arrow-clockwise ml-3 text-2xl'></i></button>

          <div className="float-right">
            <button onClick={DownloadFiles} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2'><i className="bi bi-upload"></i></button>
            <button onClick={DeleteFiles} className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-3'><i className="bi bi-trash"></i></button>
          </div>
        </div>

        <table className="table-auto divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                <input type="checkbox" onChange={CheckAll} className="h-5 w-5 text-blue-600" id="checkbox-all"/>
              </th>
              <th></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody>
            {files.length > 0 ? files.map(file => (
              <tr className="bg-gray-50" key={file.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input type="checkbox" className="h-5 w-5 text-blue-600" onChange={CheckBox}/>
                </td>
                <td className="whitespace-nowrap text-sm text-gray-500">
                  {file.thumbnail ? <img src={file.thumbnail} alt={file.name} className="w-8 h-8 rounded-md"/>
                    : <i className="bi bi-file-earmark-text text-3xl"></i>
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase tracking-wider">{file.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(file.size / 1048576).toFixed(2)} MB</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(file.date).toLocaleString()}</td>
              </tr>
            )) : (
              <tr className="bg-gray-50">
                <td className="text-1xl text-center px-6 py-4 text-gray-500" colSpan="6">No Files Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col">
        <div className='dropzone w-1/6 flex flex-col justify-center cursor-pointer ml-3' onClick={() => document.getElementById('fileInput').click()} onDragOver={FileDrop}>
          <div className='text-center mb-4 text-gray-600'>Drop Files Here</div>
          
          <div className='flex items-center justify-center'>
            <div className='bi bi-cloud-upload text-6xl'></div>
          </div>

          <input
            type='file'
            id='fileInput'
            onChange={UploadFiles}
            className='hidden'
          />
        </div>
        
        <div className='flex flex-col items-center mt-2'>
          <button disabled={true} className='bg-orange-500 text-white py-1 px-2 rounded'>{itemsSelected} Items Selected</button>
        </div>
      </div>
    </div>
  );
}

export default App;