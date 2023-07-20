const server = `http://${window.location.hostname}${process.env.USE_PORT_IN_URL === 'true' ? `:${process.env.SERVER_PORT}` : ''}`;
import { useEffect, useState } from "react";

function App()
{
  const [files, setFiles] = useState([]);

  useEffect(() => {
    FetchFiles();
  }, []);

  function FetchFiles() {
    fetch(`${server}/files`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
    })
    .then(response => response.json())
    .then(files => {

      if (files.length == 0) return document.getElementById('no-data').style.display = 'block';
      setFiles(files);
    });
  }

  function DownloadFiles() {
    const files = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    for (let i = 1; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        files.push({ name: checkboxes[i].parentNode.parentNode.childNodes[2].innerHTML });
      }
    
    } if (files.length == 0) return;

    fetch(`${server}/download`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(files),
    })
    .then(response => response.blob())
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
      });
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

    fetch(`${server}/delete`, {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(files),
    })
    .then(response => {
      if (response.status == 200) FetchFiles();
    });

    document.getElementById('checkbox-all').checked = false;
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      }
    );
  }

  function CheckAll() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
      checkbox.checked = document.getElementById('checkbox-all').checked;
    });
  }

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
          <button onClick={DownloadFiles} className='flex bg-green-500 text-white font-bold w-32 py-2 px-4 rounded'>Download</button>
          <button onClick={DeleteFiles} className='mt-2 bg-red-500 text-white font-bold w-32 py-2 px-4 rounded text-center'>Delete</button>
        </div>

        <div className="clear-both"></div>
        <br/>
      </header>

      <hr className="bg-blue-500 h-1 mb-2"/>
      <div className='body'>
        <input type='text' id='search' placeholder='Search...' className='border border-blue-500 rounded w-1/3 py-2 px-3 leading-tight focus:outline-none'/>
        <button onClick={FetchFiles}><i className='bi bi-arrow-clockwise ml-3 text-2xl'></i></button>
        <br/><br/>

        <table className="w-full table-auto divide-y divide-gray-200 border-b">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                <input type="checkbox" onChange={CheckAll} className="h-5 w-5 text-blue-600" id="checkbox-all"/>
              </th>
              <th></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => (
              <tr className="bg-gray-50" key={file.size}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input type="checkbox" className="h-5 w-5 text-blue-600"/>
                </td>
                <td className="whitespace-nowrap text-sm text-gray-500">
                  {file.thumbnail ? <img src={file.thumbnail} alt={file.name} className="w-8 h-8 rounded-md"/>
                    : <i className="bi bi-file-earmark-text text-3xl"></i>
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase tracking-wider">{file.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.size}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(file.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <center className="text-2xl mt-6 hidden" id="no-data">No Files Available</center>
      </div>
    </div>
  );
}

export default App;