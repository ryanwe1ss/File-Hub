const server = `${process.env.PROTOCOL}://${window.location.hostname}${process.env.USE_PORT_IN_URL === 'true' ? `:${process.env.PORT}` : ''}`;

import { useEffect, useState } from "react";
import AuthenticationModal from "./components/auth-modal";

function App()
{
  useEffect(() => FetchFiles(), []);

  const [count, setCount] = useState(0);
  const [files, setFiles] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token'),
      },
    })
    .then(response => {
      if (response.status == 401) throw new Error();
      return response.json();
    })
    .then(result => {
      if (tempTbody.parentNode) tempTbody.parentNode.replaceChild(previousTbody, tempTbody);

      setCount(searchQuery ? result.files.length : result.count);
      setAuthenticated(true);
      setFiles(result.files);
    })
    .catch(() => {
      if (tempTbody.parentNode) tempTbody.parentNode.replaceChild(previousTbody, tempTbody);

      setFiles([]);
      setAuthenticated(false);
      document.getElementById('modal').classList.remove('hidden');
    });
  }

  function UploadFiles(event) {
    const form = new FormData();
    const request = new XMLHttpRequest();
    const files = event.type == 'drop' ? event.dataTransfer.files : event.target.files;

    for (let i = 0; i < files.length; i++) {
      form.append('files', files[i]);
    }

    request.open('POST', `${server}/api/upload`);
    request.setRequestHeader('Authorization', localStorage.getItem('token'));

    request.upload.addEventListener('progress', event => {
      const percent = Math.round((event.loaded / event.total) * 100);
      document.querySelector('.upload').style.width = `${percent}%`;
    });

    request.addEventListener('load', () => {
      setTimeout(() => FetchFiles(), 100);
      setItemsSelected(0);

      document.getElementById('checkbox-all').checked = false;
    });

    request.send(form);
  }

  function DownloadFiles() {
    const files = [];
    const request = new XMLHttpRequest();
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    for (let file = 1; file < checkboxes.length; file++) {
      if (checkboxes[file].checked) {
        files.push({ name: checkboxes[file].parentNode.parentNode.childNodes[2].innerHTML });
      }
    
    } if (files.length == 0) return;

    request.open('POST', `${server}/api/download`);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', localStorage.getItem('token'));
    request.responseType = 'blob';

    request.addEventListener('progress', (event) => {
        const percent = Math.round((event.loaded / event.total) * 100);
        document.querySelector('.download').style.width = `${percent}%`;
    });
    
    request.addEventListener('load', () => {
      const instance = document.createElement('a');
      instance.href = window.URL.createObjectURL(request.response);

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
      });

      document.querySelector('.download').style.width = '0%';
      setItemsSelected(0);
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

    fetch(`${server}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token'),
      },
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
    if (event.target.checked) setItemsSelected(itemsSelected + 1);
    else setItemsSelected(itemsSelected - 1);
  }

  return (
    <div className='page overflow-hidden'>
      <AuthenticationModal
        server={server}
        FetchFiles={FetchFiles}
      />

      <div className="w-full">
        <div className="mb-4 flex">
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

          <div className="flex ml-auto">
            {!authenticated ?
              <button className="mr-3 ml-12"><i className="bi bi-lock-fill text-2xl text-red-500"></i></button> :
              <button className="mr-3 ml-12"><i className="bi bi-unlock-fill text-2xl text-green-500"></i></button>
            }

            <div className="download-bar mt-auto mr-3">
              <div className="download"></div>
            </div>

            <button onClick={FetchFiles} className='bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded mr-2' id='reload'><i className="bi bi-arrow-clockwise"></i></button>
            <button onClick={DownloadFiles} className='bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mr-2'><i className="bi bi-upload"></i></button>
            <button onClick={DeleteFiles} className='bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded mr-3'><i className="bi bi-trash"></i></button>
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
                    : file.type == 'txt' ? <i className="bi bi-file-text text-2xl"></i>
                    : file.type == 'pdf' ? <i className="bi bi-file-earmark-pdf text-2xl"></i>
                    : file.type == 'doc' || file.type == 'docx' ? <i className="bi bi-file-earmark-word text-2xl"></i>
                    : file.type == 'mkv' || file.type == 'mp4' || file.type == 'avi' || file.type == 'mov' ? <i className="bi bi-file-earmark-play text-2xl"></i>
                    : file.type == 'mp3' || file.type == 'wav' || file.type == 'ogg' || file.type == 'flac' ? <i className="bi bi-file-earmark-music text-2xl"></i>
                    : file.type == 'zip' || file.type == 'rar' || file.type == '7z' ? <i className="bi bi-file-earmark-zip text-2xl"></i>
                    : file.type == 'exe' ? <i className="bi bi-file-earmark-binary text-2xl"></i>
                    : <i className="bi bi-file-earmark-text text-3xl"></i>
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase tracking-wider">{file.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {file.size < 1024 ? `${file.size} B`
                    : file.size < 1048576 ? `${(file.size / 1024).toFixed(2)} KB`
                    : file.size < 1073741824 ? `${(file.size / 1048576).toFixed(2)} MB`
                    : `${(file.size / 1073741824).toFixed(2)} GB`
                  }
                </td>
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
        <div className='dropzone w-1/6 bg-gray-200 flex flex-col justify-center cursor-pointer ml-3' onClick={() => document.getElementById('fileInput').click()} onDragOver={FileDrop}>
          <div className='text-center mb-4 text-gray-600'>Drop Files Here</div>
          
          <div className='flex items-center justify-center'>
            <div className='bi bi-arrow-down-circle text-7xl'></div>
          </div>

          <div className="upload-bar mt-auto">
            <div className="upload"></div>
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